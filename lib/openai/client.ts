import type {
  CreateSessionRequest,
  OpenAISessionResponse,
  OpenAIError,
  RateLimit,
  OpenAISessionPayload,
} from '@/types/realtime';

/**
 * OpenAI Realtime API 클라이언트
 */
export class OpenAIRealtimeClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly model = 'gpt-4o-realtime-preview';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Realtime 세션 생성
   * @param request 세션 생성 요청
   * @returns 세션 정보
   */
  async createSession(
    request: CreateSessionRequest
  ): Promise<OpenAISessionResponse> {
    const url = `${this.baseUrl}/realtime/sessions`;

    const payload: OpenAISessionPayload = {
      model: this.model,
      voice: request.voice || 'verse',
      instructions: request.instructions,
      modalities: request.modalities || ['text', 'audio'],
      input_audio_format: request.input_audio_format || 'pcm16',
      output_audio_format: request.output_audio_format || 'opus',
      turn_detection: request.turn_detection || {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      input_audio_transcription: request.input_audio_transcription || {
        model: 'whisper-1',
      },
      temperature: request.temperature || 0.8,
      max_output_tokens: request.max_output_tokens || 4096,
    };

    console.log('[OpenAI] 세션 생성 요청:', {
      model: payload.model,
      voice: payload.voice,
      modalities: payload.modalities,
      instructions: `${payload.instructions.substring(0, 100)}...`,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'realtime=v1',
          'User-Agent': 'Realtime-Translator/1.0',
        },
        body: JSON.stringify(payload),
      });

      // 응답 헤더에서 속도 제한 정보 추출
      this.logRateLimits(response.headers);

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const session = (await response.json()) as OpenAISessionResponse;

      console.log('[OpenAI] 세션 생성 성공:', {
        session_id: session.id,
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        voice: session.voice,
        modalities: session.modalities,
      });

      return session;
    } catch (error) {
      console.error('[OpenAI] 세션 생성 실패:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('OpenAI API 호출 중 알 수 없는 오류가 발생했습니다.');
    }
  }

  /**
   * 세션 유효성 검사
   * @param sessionId 세션 ID
   * @returns 세션이 유효한지 여부
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const url = `${this.baseUrl}/realtime/sessions/${sessionId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * API 에러 처리
   * @param response 실패한 응답
   */
  private async handleApiError(response: Response): Promise<never> {
    let errorDetails: OpenAIError;

    try {
      errorDetails = await response.json();
    } catch {
      throw new Error(
        `OpenAI API 오류 (${response.status}): 응답을 파싱할 수 없습니다.`
      );
    }

    const { error } = errorDetails;

    // 상태 코드별 구체적인 에러 메시지
    switch (response.status) {
      case 400:
        throw new Error(`잘못된 요청: ${error.message}`);
      case 401:
        throw new Error(
          'OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.'
        );
      case 403:
        throw new Error(
          'OpenAI Realtime API 접근 권한이 없습니다. 계정 설정을 확인해주세요.'
        );
      case 404:
        throw new Error('요청한 리소스를 찾을 수 없습니다.');
      case 413:
        throw new Error('요청 데이터가 너무 큽니다.');
      case 429:
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? `${retryAfter}초 후` : '잠시 후';
        throw new Error(
          `요청 한도를 초과했습니다. ${waitTime} 다시 시도해주세요.`
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error(
          'OpenAI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
        );
      default:
        throw new Error(
          `OpenAI API 오류 (${response.status}): ${error.message}`
        );
    }
  }

  /**
   * 속도 제한 정보 로깅
   * @param headers 응답 헤더
   */
  private logRateLimits(headers: Headers): void {
    const rateLimit: Partial<RateLimit> = {};

    // 요청 수 제한
    const requestsLimit = headers.get('x-ratelimit-limit-requests');
    const requestsRemaining = headers.get('x-ratelimit-remaining-requests');
    const requestsReset = headers.get('x-ratelimit-reset-requests');

    if (requestsLimit && requestsRemaining && requestsReset) {
      rateLimit.requests = {
        limit: parseInt(requestsLimit),
        remaining: parseInt(requestsRemaining),
        reset_seconds: parseInt(requestsReset),
      };
    }

    // 토큰 수 제한
    const tokensLimit = headers.get('x-ratelimit-limit-tokens');
    const tokensRemaining = headers.get('x-ratelimit-remaining-tokens');
    const tokensReset = headers.get('x-ratelimit-reset-tokens');

    if (tokensLimit && tokensRemaining && tokensReset) {
      rateLimit.tokens = {
        limit: parseInt(tokensLimit),
        remaining: parseInt(tokensRemaining),
        reset_seconds: parseInt(tokensReset),
      };
    }

    if (rateLimit.requests || rateLimit.tokens) {
      console.log('[OpenAI] 속도 제한 정보:', rateLimit);

      // 남은 요청/토큰이 10% 미만이면 경고
      if (
        rateLimit.requests &&
        rateLimit.requests.remaining / rateLimit.requests.limit < 0.1
      ) {
        console.warn('[OpenAI] 요청 한도 부족 경고:', rateLimit.requests);
      }

      if (
        rateLimit.tokens &&
        rateLimit.tokens.remaining / rateLimit.tokens.limit < 0.1
      ) {
        console.warn('[OpenAI] 토큰 한도 부족 경고:', rateLimit.tokens);
      }
    }
  }
}

/**
 * OpenAI 클라이언트 싱글톤 인스턴스 생성
 * @param apiKey API 키
 * @returns OpenAI 클라이언트 인스턴스
 */
export function createOpenAIClient(apiKey: string): OpenAIRealtimeClient {
  return new OpenAIRealtimeClient(apiKey);
}
