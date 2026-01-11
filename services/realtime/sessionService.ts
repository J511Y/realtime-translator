import { createOpenAIClient } from '@/lib/openai/client';
import {
  createEnvSetupGuide,
  validateEnvironment,
  validateOpenAIApiKey,
} from '@/lib/env-validation';
import type {
  ApiErrorResponse,
  CreateSessionRequest,
  RealtimeSessionHealthCheckResponse,
  SessionResponse,
} from '@/types/realtime';

type CreateRealtimeSessionResult =
  | { ok: true; data: SessionResponse }
  | { ok: false; status: number; error: ApiErrorResponse };

/**
 * Realtime 세션 생성(서버 전용)
 * - app/api에서 직접 lib를 import하지 않기 위해 services 레이어로 분리
 */
export async function createRealtimeSession(
  request: CreateSessionRequest
): Promise<CreateRealtimeSessionResult> {
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    return {
      ok: false,
      status: 500,
      error: {
        error: '서버 설정 오류',
        ...(process.env.NODE_ENV === 'development'
          ? { details: createEnvSetupGuide(envValidation.missing) }
          : {}),
      },
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !validateOpenAIApiKey(apiKey)) {
    return {
      ok: false,
      status: 500,
      error: {
        error: 'OpenAI API 키가 올바르지 않습니다.',
        code: 'invalid_api_key',
      },
    };
  }

  try {
    const openAIClient = createOpenAIClient(apiKey);
    const session = await openAIClient.createSession(request);

    const response: SessionResponse = {
      client_secret: session.client_secret.value,
      expires_at: session.client_secret.expires_at,
      session_id: session.id,
      session_config: {
        voice: session.voice,
        modalities: session.modalities,
        input_audio_format: session.input_audio_format,
        output_audio_format: session.output_audio_format,
      },
    };

    return { ok: true, data: response };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      ok: false,
      status: 500,
      error: {
        error: message,
        code: 'openai_api_error',
      },
    };
  }
}

/**
 * Realtime 세션 API 헬스체크 응답 생성(서버 전용)
 */
export function createRealtimeSessionHealthCheckResponse(params: {
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  activeClients: number;
}): RealtimeSessionHealthCheckResponse {
  const envValidation = validateEnvironment();

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      has_openai_key: !!process.env.OPENAI_API_KEY,
      has_google_key: !!process.env.GOOGLE_API_KEY,
      has_azure_keys: !!(
        process.env.AZURE_API_KEY && process.env.AZURE_ENDPOINT
      ),
    },
    validation: envValidation,
    rate_limits: {
      window_ms: params.rateLimitWindowMs,
      max_requests: params.rateLimitMaxRequests,
      active_clients: params.activeClients,
    },
  };
}
