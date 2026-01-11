import { NextRequest, NextResponse } from 'next/server';
import {
  createRealtimeSession,
  createRealtimeSessionHealthCheckResponse,
} from '@/services/realtime/sessionService';
import type {
  AudioFormat,
  CreateSessionRequest,
  CreateSessionRequestInput,
  ApiErrorResponse,
  Modality,
  VoiceType,
} from '@/types/realtime';

/**
 * 세션 생성 요청 속도 제한 관리
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const RATE_LIMIT_MAX_REQUESTS = 10; // 1분당 최대 10개 세션

/**
 * IP 기반 속도 제한 검사
 * @param ip 클라이언트 IP
 * @returns 요청이 허용되는지 여부
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > clientData.resetTime) {
    // 시간 창이 만료되어 초기화
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  clientData.count++;
  return true;
}

/**
 * 클라이언트 IP 주소 추출
 * @param request Next.js 요청 객체
 * @returns IP 주소
 */
function getClientIP(request: NextRequest): string {
  // Vercel, Netlify 등에서 제공하는 헤더들 확인
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return '127.0.0.1'; // Next.js에서는 헤더를 통해서만 IP 확인 가능
}

const VALID_VOICES = [
  'verse',
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
] as const;

const VALID_MODALITIES = ['text', 'audio'] as const;

const VALID_AUDIO_FORMATS = ['pcm16', 'g711_ulaw', 'g711_alaw'] as const;

function isVoiceType(value: string): value is VoiceType {
  return (VALID_VOICES as readonly string[]).includes(value);
}

function isModality(value: string): value is Modality {
  return (VALID_MODALITIES as readonly string[]).includes(value);
}

function isAudioFormat(value: string): value is AudioFormat {
  return (VALID_AUDIO_FORMATS as readonly string[]).includes(value);
}

/**
 * 요청 유효성 검사
 * @param body 요청 본문
 * @returns 유효성 검사 결과
 */
function validateRequest(body: CreateSessionRequestInput): {
  isValid: boolean;
  error?: string;
  data?: CreateSessionRequest;
} {
  if (!body) {
    return { isValid: false, error: '요청 본문이 없습니다.' };
  }

  const {
    instructions,
    voice,
    modalities,
    input_audio_format,
    output_audio_format,
  } = body;

  // 필수 필드 검사
  if (
    !instructions ||
    typeof instructions !== 'string' ||
    instructions.trim().length === 0
  ) {
    return {
      isValid: false,
      error: '번역 지시사항(instructions)이 필요합니다.',
    };
  }

  if (instructions.length > 2000) {
    return {
      isValid: false,
      error: '번역 지시사항은 2000자를 초과할 수 없습니다.',
    };
  }

  let validatedVoice: VoiceType | undefined;
  if (voice !== undefined) {
    if (typeof voice !== 'string') {
      return { isValid: false, error: 'voice는 문자열이어야 합니다.' };
    }
    const trimmed = voice.trim();
    if (trimmed.length > 0) {
      if (isVoiceType(trimmed)) {
        validatedVoice = trimmed;
      } else {
        return {
          isValid: false,
          error: `지원하지 않는 음성입니다. 사용 가능: ${VALID_VOICES.join(', ')}`,
        };
      }
    }
  }

  let validatedModalities: Modality[] | undefined;
  if (modalities !== undefined) {
    if (!Array.isArray(modalities) || modalities.length === 0) {
      return {
        isValid: false,
        error: '모달리티는 비어있지 않은 배열이어야 합니다.',
      };
    }

    const nonString = modalities.find(m => typeof m !== 'string');
    if (nonString !== undefined) {
      return {
        isValid: false,
        error: '모달리티는 문자열 배열이어야 합니다.',
      };
    }

    const invalidModalities = (modalities as string[]).filter(
      m => !isModality(m)
    );
    if (invalidModalities.length > 0) {
      return {
        isValid: false,
        error: `지원하지 않는 모달리티: ${invalidModalities.join(', ')}`,
      };
    }
    validatedModalities = (modalities as string[]).map(m => m as Modality);
  }

  let validatedInputAudioFormat: AudioFormat | undefined;
  if (input_audio_format !== undefined) {
    if (typeof input_audio_format !== 'string') {
      return {
        isValid: false,
        error: 'input_audio_format은 문자열이어야 합니다.',
      };
    }
    const trimmed = input_audio_format.trim();
    if (trimmed.length > 0) {
      if (!isAudioFormat(trimmed)) {
        return {
          isValid: false,
          error: `지원하지 않는 입력 오디오 포맷: ${trimmed}`,
        };
      }
      validatedInputAudioFormat = trimmed;
    }
  }

  let validatedOutputAudioFormat: AudioFormat | undefined;
  if (output_audio_format !== undefined) {
    if (typeof output_audio_format !== 'string') {
      return {
        isValid: false,
        error: 'output_audio_format은 문자열이어야 합니다.',
      };
    }
    const trimmed = output_audio_format.trim();
    if (trimmed.length > 0) {
      if (!isAudioFormat(trimmed)) {
        return {
          isValid: false,
          error: `지원하지 않는 출력 오디오 포맷: ${trimmed}`,
        };
      }
      validatedOutputAudioFormat = trimmed;
    }
  }

  const data: CreateSessionRequest = {
    instructions: instructions.trim(),
    ...(validatedVoice ? { voice: validatedVoice } : {}),
    ...(validatedModalities ? { modalities: validatedModalities } : {}),
    ...(validatedInputAudioFormat
      ? { input_audio_format: validatedInputAudioFormat }
      : {}),
    ...(validatedOutputAudioFormat
      ? { output_audio_format: validatedOutputAudioFormat }
      : {}),
  };

  return { isValid: true, data };
}

/**
 * POST /api/realtime/session
 * OpenAI Realtime API를 위한 Ephemeral Token 발급
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<
    | {
        client_secret: string;
        expires_at: number;
        session_id: string;
        session_config: {
          voice: VoiceType;
          modalities: Modality[];
          input_audio_format: AudioFormat;
          output_audio_format: AudioFormat;
        };
      }
    | ApiErrorResponse
  >
> {
  const startTime = Date.now();

  try {
    // 1. 속도 제한 검사
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      console.warn('[Session] 속도 제한 초과:', { ip: clientIP });

      return NextResponse.json(
        {
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          code: 'rate_limit_exceeded',
        } as ApiErrorResponse,
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Window': RATE_LIMIT_WINDOW.toString(),
          },
        }
      );
    }

    // 2. 요청 본문 파싱 및 검증
    let requestBody: CreateSessionRequestInput;
    try {
      requestBody = (await request.json()) as CreateSessionRequestInput;
    } catch (error) {
      console.error('[Session] JSON 파싱 실패:', error);

      return NextResponse.json(
        { error: '잘못된 JSON 형식입니다.', code: 'invalid_json' },
        { status: 400 }
      );
    }

    const validation = validateRequest(requestBody);
    if (!validation.isValid) {
      console.error('[Session] 요청 검증 실패:', validation.error);

      return NextResponse.json(
        { error: validation.error!, code: 'validation_error' },
        { status: 400 }
      );
    }

    // 3. Realtime 세션 생성 (services 레이어)
    console.log('[Session] 세션 생성 시작:', {
      ip: clientIP,
      instructions: `${validation.data?.instructions.substring(0, 50)}...`,
      voice: validation.data?.voice || 'verse',
      modalities: validation.data?.modalities || ['text', 'audio'],
    });

    const createResult = await createRealtimeSession(
      validation.data as CreateSessionRequest
    );
    if (!createResult.ok) {
      return NextResponse.json(createResult.error, {
        status: createResult.status,
      });
    }

    const response = createResult.data;

    const processingTime = Date.now() - startTime;
    console.log('[Session] 세션 생성 완료:', {
      session_id: response.session_id,
      processing_time: `${processingTime}ms`,
      expires_in: `${Math.floor((response.expires_at * 1000 - Date.now()) / 1000)}s`,
    });

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Processing-Time': processingTime.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[Session] 세션 생성 실패:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      processing_time: `${processingTime}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // OpenAI API 에러는 사용자에게 전달
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'openai_api_error',
        } as ApiErrorResponse,
        {
          status: 500,
          headers: {
            'X-Processing-Time': processingTime.toString(),
          },
        }
      );
    }

    // 기타 예상치 못한 에러
    return NextResponse.json(
      {
        error: '서버 내부 오류가 발생했습니다.',
        code: 'internal_server_error',
      } as ApiErrorResponse,
      {
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  }
}

/**
 * GET /api/realtime/session
 * API 상태 확인용 헬스체크 엔드포인트
 */
export async function GET(): Promise<NextResponse> {
  const status = createRealtimeSessionHealthCheckResponse({
    rateLimitWindowMs: RATE_LIMIT_WINDOW,
    rateLimitMaxRequests: RATE_LIMIT_MAX_REQUESTS,
    activeClients: rateLimitMap.size,
  });

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
