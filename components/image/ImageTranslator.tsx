'use client';

/**
 * 이미지 번역 컴포넌트
 *
 * - 카메라 촬영 또는 갤러리에서 이미지 선택
 * - OpenAI Vision API를 통해 이미지 내 텍스트 추출 및 번역
 * - 번역 결과를 텍스트 블록 + 요약 형태로 표시
 */

import { useState, useRef, useCallback } from 'react';
import type { SupportedLanguage } from '@/types/realtime';
import type {
  ImageTranslateState,
  ImageTranslateResult,
  ImageTranslateResponse,
} from '@/types/image';

/** 지원 언어 정보 */
const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: '포르투갈어', flag: '🇵🇹' },
  { code: 'en', name: '영어', flag: '🇺🇸' },
  { code: 'es', name: '스페인어', flag: '🇪🇸' },
  { code: 'fr', name: '프랑스어', flag: '🇫🇷' },
  { code: 'ja', name: '일본어', flag: '🇯🇵' },
  { code: 'zh', name: '중국어', flag: '🇨🇳' },
];

export interface ImageTranslatorProps {
  /** 기본 대상 언어 */
  defaultTargetLanguage?: SupportedLanguage;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 이미지 번역 컴포넌트
 */
export function ImageTranslator({
  defaultTargetLanguage = 'ko',
  className = '',
}: ImageTranslatorProps) {
  // 상태 관리
  const [state, setState] = useState<ImageTranslateState>('idle');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(
    defaultTargetLanguage
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImageTranslateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /**
   * 이미지 파일 처리
   */
  const handleImageFile = useCallback(
    async (file: File) => {
      // 이미지 유효성 검사
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 지원합니다.');
        return;
      }

      // 크기 검사 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지 크기는 10MB 이하여야 합니다.');
        return;
      }

      setState('uploading');
      setError(null);
      setResult(null);

      try {
        // Base64로 변환
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
          reader.readAsDataURL(file);
        });

        setImagePreview(base64);
        setState('translating');

        // API 호출
        const response = await fetch('/api/image/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            targetLanguage,
          }),
        });

        const data = (await response.json()) as ImageTranslateResponse;

        if (!data.success || !data.data) {
          throw new Error(data.error || '번역에 실패했습니다.');
        }

        setResult(data.data);
        setState('done');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
        );
        setState('error');
      }
    },
    [targetLanguage]
  );

  /**
   * 파일 선택 핸들러
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageFile(file);
      }
      // input 초기화 (같은 파일 재선택 가능하도록)
      e.target.value = '';
    },
    [handleImageFile]
  );

  /**
   * 초기화
   */
  const handleReset = useCallback(() => {
    setState('idle');
    setImagePreview(null);
    setResult(null);
    setError(null);
  }, []);

  /**
   * 갤러리에서 선택
   */
  const handleGalleryClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * 카메라로 촬영
   */
  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  return (
    <div className={`flex min-h-[80vh] flex-col ${className}`}>
      {/* 언어 선택 */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          번역 언어:
        </label>
        <select
          value={targetLanguage}
          onChange={e => setTargetLanguage(e.target.value as SupportedLanguage)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          disabled={state === 'translating'}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 초기 상태: 이미지 선택 */}
      {state === 'idle' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-center">
            <div className="mb-2 text-6xl">📸</div>
            <p className="text-gray-600 dark:text-gray-400">
              번역할 이미지를 선택하세요
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCameraClick}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <CameraIcon />
              카메라
            </button>
            <button
              onClick={handleGalleryClick}
              className="flex items-center gap-2 rounded-xl bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
            >
              <GalleryIcon />
              갤러리
            </button>
          </div>
        </div>
      )}

      {/* 업로드/번역 중 */}
      {(state === 'uploading' || state === 'translating') && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {imagePreview && (
            <div className="relative h-48 w-48 overflow-hidden rounded-xl">
              <img
                src={imagePreview}
                alt="미리보기"
                className="h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            </div>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            {state === 'uploading' ? '이미지 처리 중...' : '번역 중...'}
          </p>
        </div>
      )}

      {/* 에러 상태 */}
      {state === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-6xl">❌</div>
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={handleReset}
            className="rounded-xl bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 결과 표시 */}
      {state === 'done' && result && (
        <div className="flex flex-1 flex-col gap-4">
          {/* 이미지 미리보기 */}
          {imagePreview && (
            <div className="relative mx-auto max-w-md overflow-hidden rounded-xl">
              <img
                src={imagePreview}
                alt="원본 이미지"
                className="h-auto w-full"
              />
            </div>
          )}

          {/* 요약 */}
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
            <h3 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-300">
              요약
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{result.summary}</p>
          </div>

          {/* 텍스트 블록 */}
          {result.textBlocks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                텍스트 번역
              </h3>
              {result.textBlocks.map((block, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  {block.type && (
                    <span className="mb-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      {block.type}
                    </span>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {block.original}
                  </p>
                  <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">
                    {block.translated}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 문화적 메모 */}
          {result.culturalNote && (
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <h3 className="mb-2 font-semibold text-amber-800 dark:text-amber-300">
                참고
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {result.culturalNote}
              </p>
            </div>
          )}

          {/* 새로운 이미지 버튼 */}
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <CameraIcon />새 이미지
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 카메라 아이콘 */
function CameraIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

/** 갤러리 아이콘 */
function GalleryIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
