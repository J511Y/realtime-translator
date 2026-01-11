/**
 * 이미지 번역 관련 타입 정의
 */

import type { SupportedLanguage } from './realtime';

/** 이미지 번역 요청 (클라이언트 → API) */
export interface ImageTranslateRequest {
  /** Base64 인코딩된 이미지 (data:image/... 형식 또는 순수 base64) */
  image: string;
  /** 원본 언어 (자동 감지 시 생략 가능) */
  sourceLanguage?: SupportedLanguage | undefined;
  /** 번역 대상 언어 */
  targetLanguage: SupportedLanguage;
}

/** 텍스트 위치 정보 (이미지 기준 퍼센트 좌표) */
export interface TextPosition {
  /** 좌측 상단 X 좌표 (0-100%) */
  x: number;
  /** 좌측 상단 Y 좌표 (0-100%) */
  y: number;
  /** 너비 (0-100%) */
  width: number;
  /** 높이 (0-100%) */
  height: number;
}

/** 이미지 내 텍스트 블록 정보 */
export interface TextBlock {
  /** 원본 텍스트 */
  original: string;
  /** 번역된 텍스트 */
  translated: string;
  /** 텍스트 유형 (메뉴, 간판, 안내문, 라벨 등) */
  type?: string | undefined;
  /** 이미지 내 텍스트 위치 (퍼센트 좌표) */
  position?: TextPosition | undefined;
}

/** 이미지 번역 결과 */
export interface ImageTranslateResult {
  /** 감지된 원본 언어 */
  detectedLanguage: SupportedLanguage | null;
  /** 번역된 텍스트 블록 목록 */
  textBlocks: TextBlock[];
  /** 전체 요약 설명 (이미지 컨텍스트 포함) */
  summary: string;
  /** 문화적/맥락적 설명 (필요한 경우) */
  culturalNote?: string | undefined;
}

/** 이미지 번역 API 응답 */
export interface ImageTranslateResponse {
  success: boolean;
  data?: ImageTranslateResult | undefined;
  error?: string | undefined;
}

/** 이미지 번역 상태 */
export type ImageTranslateState =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'translating'
  | 'done'
  | 'error';

/** 이미지 번역 히스토리 항목 */
export interface ImageTranslateHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  sourceLanguage: SupportedLanguage | null;
  targetLanguage: SupportedLanguage;
  result: ImageTranslateResult;
}
