import { createVisionClient } from '@/lib/openai/vision-client';
import {
  validateEnvironment,
  validateOpenAIApiKey,
  createEnvSetupGuide,
} from '@/lib/env-validation';
import type {
  ImageTranslateRequest,
  ImageTranslateResult,
  ImageTranslateResponse,
} from '@/types/image';

/** 이미지 번역 서비스 결과 타입 */
type TranslateImageResult =
  | { ok: true; data: ImageTranslateResult }
  | { ok: false; status: number; error: string };

/** 최대 이미지 크기 (10MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * 이미지 번역 수행 (서버 전용)
 * - app/api에서 직접 lib를 import하지 않기 위해 services 레이어로 분리
 */
export async function translateImage(
  request: ImageTranslateRequest
): Promise<TranslateImageResult> {
  // 환경 검증
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    return {
      ok: false,
      status: 500,
      error:
        process.env.NODE_ENV === 'development'
          ? createEnvSetupGuide(envValidation.missing)
          : '서버 설정 오류',
    };
  }

  // API 키 검증
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !validateOpenAIApiKey(apiKey)) {
    return {
      ok: false,
      status: 500,
      error: 'OpenAI API 키가 올바르지 않습니다.',
    };
  }

  // 이미지 크기 검증
  const imageSize = estimateBase64Size(request.image);
  if (imageSize > MAX_IMAGE_SIZE) {
    return {
      ok: false,
      status: 413,
      error: `이미지가 너무 큽니다. 최대 ${MAX_IMAGE_SIZE / 1024 / 1024}MB까지 지원합니다.`,
    };
  }

  try {
    const visionClient = createVisionClient(apiKey);
    const result = await visionClient.translateImage(
      request.image,
      request.targetLanguage,
      request.sourceLanguage
    );

    console.log('[ImageTranslateService] 번역 완료:', {
      detectedLanguage: result.detectedLanguage,
      textBlockCount: result.textBlocks.length,
    });

    return { ok: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[ImageTranslateService] 번역 실패:', message);

    return {
      ok: false,
      status: 500,
      error: message,
    };
  }
}

/**
 * Base64 문자열의 대략적인 바이트 크기 추정
 */
function estimateBase64Size(base64: string): number {
  // data:image/... 접두사 제거
  const pureBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  // Base64는 원본 대비 약 4/3 비율
  return Math.ceil((pureBase64.length * 3) / 4);
}

/**
 * 이미지 번역 API 응답 생성
 */
export function createImageTranslateResponse(
  result: TranslateImageResult
): ImageTranslateResponse {
  if (result.ok) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: result.error,
  };
}
