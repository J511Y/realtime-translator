import type {
  ApiErrorResponse,
  CreateSessionRequest,
  RealtimeSessionHealthCheckResponse,
  SessionResponse,
} from '@/types/realtime';

type HealthCheckResult =
  | { success: true; data: RealtimeSessionHealthCheckResponse }
  | { success: false; error: string };

type CreateSessionResult =
  | { success: true; status: number; data: SessionResponse }
  | { success: false; status?: number; error: string };

/**
 * 세션 생성 API 테스트 헬퍼
 */
export class SessionAPITester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * 헬스체크 API 테스트
   */
  async testHealthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/realtime/session`, {
        method: 'GET',
      });

      const data = (await response.json()) as
        | RealtimeSessionHealthCheckResponse
        | ApiErrorResponse;

      if (response.ok) {
        return {
          success: true,
          data: data as RealtimeSessionHealthCheckResponse,
        };
      }

      return {
        success: false,
        error: (data as ApiErrorResponse).error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * 세션 생성 API 테스트
   */
  async testCreateSession(
    request: CreateSessionRequest
  ): Promise<CreateSessionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/realtime/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = (await response.json()) as
        | SessionResponse
        | ApiErrorResponse;

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          data: data as SessionResponse,
        };
      }

      return {
        success: false,
        status: response.status,
        error: (data as ApiErrorResponse).error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * 기본 번역 세션 생성 테스트
   */
  async testBasicTranslationSession(): Promise<void> {
    console.log('🧪 기본 번역 세션 생성 테스트 시작...');

    const request: CreateSessionRequest = {
      instructions:
        '당신은 한국어-포르투갈어 실시간 번역기입니다. 사용자의 발화를 자연스럽고 정확하게 번역하여 음성으로 응답하세요.',
      voice: 'verse',
      modalities: ['text', 'audio'],
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
    };

    const result = await this.testCreateSession(request);

    if (!result.success) {
      console.error('❌ 세션 생성 실패:', {
        error: result.error,
        status: result.status,
      });
      return;
    }

    console.log('✅ 세션 생성 성공:', {
      session_id: result.data.session_id,
      expires_at: new Date(result.data.expires_at * 1000).toISOString(),
      voice: result.data.session_config.voice,
      modalities: result.data.session_config.modalities,
    });
  }

  /**
   * 잘못된 요청 테스트
   */
  async testInvalidRequests(): Promise<void> {
    console.log('🧪 잘못된 요청 처리 테스트 시작...');

    const testCases = [
      {
        name: '빈 instructions',
        request: { instructions: '' },
        expectedStatus: 400,
      },
      {
        name: '잘못된 voice',
        request: {
          instructions: '테스트',
          voice: 'invalid_voice',
        },
        expectedStatus: 400,
      },
      {
        name: '잘못된 modality',
        request: {
          instructions: '테스트',
          modalities: ['invalid_modality'],
        },
        expectedStatus: 400,
      },
    ];

    for (const testCase of testCases) {
      const result = await this.testCreateSession(
        testCase.request as CreateSessionRequest
      );

      if (!result.success && result.status === testCase.expectedStatus) {
        console.log(
          `✅ ${testCase.name}: 예상대로 ${testCase.expectedStatus} 에러 반환`
        );
        continue;
      }

      console.error(
        `❌ ${testCase.name}: 예상 상태 ${testCase.expectedStatus}, 실제 ${result.success ? result.status : result.status}`
      );
    }
  }

  /**
   * 속도 제한 테스트
   */
  async testRateLimit(): Promise<void> {
    console.log('🧪 속도 제한 테스트 시작...');

    const request: CreateSessionRequest = {
      instructions: '속도 제한 테스트용 세션입니다.',
      voice: 'verse',
    };

    let successCount = 0;
    let rateLimitCount = 0;

    // 15개 요청을 빠르게 보내서 속도 제한 확인
    const promises = Array.from({ length: 15 }, async _ => {
      const result = await this.testCreateSession(request);

      if (result.success) {
        successCount++;
      } else if (result.status === 429) {
        rateLimitCount++;
      }

      return result;
    });

    await Promise.all(promises);

    console.log(`📊 속도 제한 테스트 결과:`, {
      success: successCount,
      rate_limited: rateLimitCount,
      expected_limit: '10 requests/minute',
    });

    if (rateLimitCount > 0) {
      console.log('✅ 속도 제한이 올바르게 작동합니다.');
    } else {
      console.warn(
        '⚠️ 속도 제한이 작동하지 않거나 임계값에 도달하지 않았습니다.'
      );
    }
  }

  /**
   * 전체 API 테스트 실행
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Realtime Session API 테스트 시작\n');

    // 1. 헬스체크
    console.log('1️⃣ 헬스체크 테스트');
    const healthResult = await this.testHealthCheck();
    if (healthResult.success) {
      console.log('✅ 헬스체크 통과');
      console.log('   환경 정보:', healthResult.data.environment);
    } else {
      console.error('❌ 헬스체크 실패:', healthResult.error);
      return; // 헬스체크 실패하면 다른 테스트 중단
    }

    console.log('\n2️⃣ 기본 기능 테스트');
    await this.testBasicTranslationSession();

    console.log('\n3️⃣ 에러 처리 테스트');
    await this.testInvalidRequests();

    console.log('\n4️⃣ 속도 제한 테스트');
    await this.testRateLimit();

    console.log('\n🎉 모든 테스트 완료');
  }
}

/**
 * 개발 환경에서 API 테스트 실행
 */
export async function runDevelopmentTests(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ 이 테스트는 개발 환경에서만 실행됩니다.');
    return;
  }

  const tester = new SessionAPITester();
  await tester.runAllTests();
}
