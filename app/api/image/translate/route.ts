import { NextRequest, NextResponse } from 'next/server';
import {
  translateImage,
  createImageTranslateResponse,
} from '@/services/image/translateService';
import type {
  ImageTranslateRequest,
  ImageTranslateResponse,
} from '@/types/image';
import type { SupportedLanguage } from '@/types/realtime';

/** 속도 제한 관리 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const RATE_LIMIT_MAX_REQUESTS = 20; // 1분당 최대 20개 요청

/** 지원하는 언어 목록 */
const VALID_LANGUAGES: SupportedLanguage[] = [
  'ko',
  'pt',
  'en',
  'es',
  'fr',
  'ja',
  'zh',
];

/**
 * IP 기반 속도 제한 검사
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > clientData.resetTime) {
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
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return '127.0.0.1';
}

/**
 * 언어 코드 유효성 검사
 */
function isValidLanguage(lang: unknown): lang is SupportedLanguage {
  return (
    typeof lang === 'string' &&
    VALID_LANGUAGES.includes(lang as SupportedLanguage)
  );
}

/**
 * 요청 유효성 검사
 */
function validateRequest(body: unknown): {
  isValid: boolean;
  error?: string;
  data?: ImageTranslateRequest;
} {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: '요청 본문이 없습니다.' };
  }

  const { image, sourceLanguage, targetLanguage } = body as Record<
    string,
    unknown
  >;

  // 이미지 필수 검사
  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    return { isValid: false, error: '이미지가 필요합니다.' };
  }

  // Base64 형식 검사 (간단한 검증)
  const isBase64 =
    image.startsWith('data:image/') ||
    /^[A-Za-z0-9+/=]+$/.test(image.substring(0, 100));
  if (!isBase64) {
    return { isValid: false, error: '올바른 이미지 형식이 아닙니다.' };
  }

  // 대상 언어 필수 검사
  if (!isValidLanguage(targetLanguage)) {
    return {
      isValid: false,
      error: `지원하지 않는 대상 언어입니다. 사용 가능: ${VALID_LANGUAGES.join(', ')}`,
    };
  }

  // 원본 언어 선택적 검사
  if (sourceLanguage !== undefined && !isValidLanguage(sourceLanguage)) {
    return {
      isValid: false,
      error: `지원하지 않는 원본 언어입니다. 사용 가능: ${VALID_LANGUAGES.join(', ')}`,
    };
  }

  return {
    isValid: true,
    data: {
      image: image as string,
      targetLanguage,
      sourceLanguage: sourceLanguage as SupportedLanguage | undefined,
    },
  };
}

/**
 * POST /api/image/translate
 * 이미지 내 텍스트 번역
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ImageTranslateResponse>> {
  const startTime = Date.now();

  try {
    // 1. 속도 제한 검사
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      console.warn('[ImageTranslate] 속도 제한 초과:', { ip: clientIP });

      return NextResponse.json(
        {
          success: false,
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          },
        }
      );
    }

    // 2. 요청 본문 파싱 및 검증
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      );
    }

    const validation = validateRequest(requestBody);
    if (!validation.isValid) {
      console.error('[ImageTranslate] 요청 검증 실패:', validation.error);

      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 3. 이미지 번역 수행
    console.log('[ImageTranslate] 번역 시작:', {
      ip: clientIP,
      targetLanguage: validation.data?.targetLanguage,
      sourceLanguage: validation.data?.sourceLanguage || 'auto',
      imageSize: `${Math.round((validation.data?.image.length || 0) / 1024)}KB`,
    });

    const result = await translateImage(
      validation.data as ImageTranslateRequest
    );
    const response = createImageTranslateResponse(result);

    const processingTime = Date.now() - startTime;
    console.log('[ImageTranslate] 번역 완료:', {
      success: result.ok,
      processing_time: `${processingTime}ms`,
    });

    return NextResponse.json(response, {
      status: result.ok ? 200 : result.status,
      headers: {
        'X-Processing-Time': processingTime.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[ImageTranslate] 번역 실패:', {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      processing_time: `${processingTime}ms`,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '서버 내부 오류가 발생했습니다.',
      },
      {
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  }
}
