// 이미지 번역 타입 re-export
export * from './image';

// 번역 관련 타입 정의
export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  model?: 'openai' | 'gemini';
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  model: string;
  processingTime: number;
}

// OCR 관련 타입 정의
export interface OcrRequest {
  image: File | Blob;
  targetLang?: string;
  model?: 'google' | 'azure' | 'gemini';
}

export interface OcrResponse {
  extractedText: string;
  translatedText?: string;
  confidence: number;
  model: string;
  processingTime: number;
}

// 음성 번역 관련 타입 정의
export interface VoiceTranslationConfig {
  inputLang: string;
  outputLang: string;
  preserveTone: boolean;
  preserveSpeed: boolean;
  model: 'openai' | 'gemini';
}

export interface VoiceTranslationResponse {
  audioUrl: string;
  transcript: string;
  translatedText: string;
  confidence: number;
  processingTime: number;
}

// API 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 모델 설정 타입
export interface ModelConfig {
  translation: {
    openai: string;
    gemini: string;
  };
  ocr: {
    google: string;
    azure: string;
    gemini: string;
  };
}
