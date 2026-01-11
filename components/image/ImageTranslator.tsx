'use client';

/**
 * 이미지 번역 컴포넌트
 *
 * - 카메라 촬영 또는 갤러리에서 이미지 선택
 * - OpenAI Vision API를 통해 이미지 내 텍스트 추출 및 번역
 * - 탭 기반 UI로 요약/상세 구분하여 직관적 표시
 */

import { useState, useRef, useCallback } from 'react';
import type { SupportedLanguage } from '@/types/realtime';
import type {
  ImageTranslateState,
  ImageTranslateResult,
  ImageTranslateResponse,
  TextBlock,
} from '@/types/image';

/** 지원 언어 정보 */
const LANGUAGES: {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}[] = [
  { code: 'ko', name: '한국어', nativeName: '한국어' },
  { code: 'pt', name: '포르투갈어', nativeName: 'Português' },
  { code: 'en', name: '영어', nativeName: 'English' },
  { code: 'es', name: '스페인어', nativeName: 'Español' },
  { code: 'fr', name: '프랑스어', nativeName: 'Français' },
  { code: 'ja', name: '일본어', nativeName: '日本語' },
  { code: 'zh', name: '중국어', nativeName: '中文' },
];

/** 결과 탭 타입 */
type ResultTab = 'overlay' | 'summary' | 'detail';

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
  const [activeTab, setActiveTab] = useState<ResultTab>('summary');

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
      setActiveTab('overlay');

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
    setActiveTab('overlay');
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

  const selectedLang = LANGUAGES.find(l => l.code === targetLanguage);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 언어 선택 */}
      <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">번역 언어</span>
          <select
            value={targetLanguage}
            onChange={e =>
              setTargetLanguage(e.target.value as SupportedLanguage)
            }
            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={state === 'translating'}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
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
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-gray-400 mb-6 text-center">
            번역할 이미지를 선택하세요
          </p>

          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={handleCameraClick}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
            >
              <CameraIcon />
              카메라
            </button>
            <button
              onClick={handleGalleryClick}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              <GalleryIcon />
              갤러리
            </button>
          </div>
        </div>
      )}

      {/* 업로드/번역 중 */}
      {(state === 'uploading' || state === 'translating') && (
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          {imagePreview && (
            <div className="relative w-48 h-48 overflow-hidden rounded-2xl mb-6">
              <img
                src={imagePreview}
                alt="미리보기"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
          <p className="text-gray-400">
            {state === 'uploading'
              ? '이미지 처리 중...'
              : '텍스트 인식 및 번역 중...'}
          </p>
        </div>
      )}

      {/* 에러 상태 */}
      {state === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-red-400 text-center mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 결과 표시 */}
      {state === 'done' && result && (
        <div className="flex flex-col gap-4">
          {/* 탭 네비게이션 */}
          <div className="flex bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('overlay')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overlay'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              이미지
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'summary'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              요약
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'detail'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              목록 ({result.textBlocks.length})
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          {activeTab === 'overlay' ? (
            <ImageOverlayView
              imagePreview={imagePreview}
              textBlocks={result.textBlocks}
              onReset={handleReset}
            />
          ) : activeTab === 'summary' ? (
            <div className="space-y-4">
              {/* 요약 카드 */}
              <div className="p-5 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-base leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* 문화적 메모 */}
              {result.culturalNote && (
                <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-600 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-amber-200 text-sm">
                      {result.culturalNote}
                    </p>
                  </div>
                </div>
              )}

              {/* 번역 언어 표시 */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>원문</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <span className="text-emerald-400">
                  {selectedLang?.nativeName}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {result.textBlocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  인식된 텍스트가 없습니다
                </div>
              ) : (
                result.textBlocks.map((block, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-800 border border-gray-700 rounded-xl"
                  >
                    {block.type && (
                      <span className="inline-block mb-2 px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-md">
                        {block.type}
                      </span>
                    )}
                    {/* 원문 */}
                    <p className="text-gray-500 text-sm mb-2 pb-2 border-b border-gray-700">
                      {block.original}
                    </p>
                    {/* 번역 */}
                    <p className="text-white font-medium">{block.translated}</p>
                  </div>
                ))
              )}
            </div>
          )}
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

/** 이미지 오버레이 뷰 Props */
interface ImageOverlayViewProps {
  imagePreview: string | null;
  textBlocks: TextBlock[];
  onReset: () => void;
}

/**
 * 이미지 오버레이 뷰 컴포넌트
 * 이미지 위에 번역 결과를 위치 기반으로 표시
 */
function ImageOverlayView({
  imagePreview,
  textBlocks,
  onReset,
}: ImageOverlayViewProps) {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  // 위치 정보가 있는 블록만 필터링
  const blocksWithPosition = textBlocks.filter(block => block.position);
  const hasPositionData = blocksWithPosition.length > 0;

  return (
    <div className="space-y-3">
      {/* 이미지 + 오버레이 */}
      <div className="relative rounded-xl overflow-hidden bg-gray-800">
        {imagePreview && (
          <img src={imagePreview} alt="원본 이미지" className="w-full h-auto" />
        )}

        {/* 텍스트 위치 오버레이 */}
        {showOverlay && hasPositionData && (
          <div className="absolute inset-0">
            {blocksWithPosition.map((block, index) => {
              const pos = block.position!;
              const isSelected = selectedBlock === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedBlock(isSelected ? null : index)}
                  className={`absolute transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/40 border-2 border-emerald-400 z-10'
                      : 'bg-blue-500/30 border border-blue-400/50 hover:bg-blue-500/50'
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${pos.width}%`,
                    height: `${pos.height}%`,
                  }}
                  aria-label={`텍스트 블록 ${index + 1}: ${block.original}`}
                >
                  {/* 번호 표시 */}
                  <span
                    className={`absolute -top-2 -left-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 컨트롤 버튼들 */}
        <div className="absolute top-3 right-3 flex gap-2">
          {hasPositionData && (
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`p-2 rounded-lg transition-colors ${
                showOverlay
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-900/80 text-gray-400 hover:text-white'
              }`}
              aria-label={showOverlay ? '오버레이 숨기기' : '오버레이 표시'}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </button>
          )}
          <button
            onClick={onReset}
            className="p-2 bg-gray-900/80 hover:bg-gray-800 text-white rounded-lg transition-colors"
            aria-label="새 이미지"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 선택된 블록 상세 정보 */}
      {selectedBlock !== null && blocksWithPosition[selectedBlock] && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                {selectedBlock + 1}
              </span>
              {blocksWithPosition[selectedBlock].type && (
                <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-md">
                  {blocksWithPosition[selectedBlock].type}
                </span>
              )}
            </span>
            <button
              onClick={() => setSelectedBlock(null)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-2">
            {blocksWithPosition[selectedBlock].original}
          </p>
          <p className="text-white font-medium">
            {blocksWithPosition[selectedBlock].translated}
          </p>
        </div>
      )}

      {/* 위치 정보가 없는 경우 안내 */}
      {!hasPositionData && textBlocks.length > 0 && (
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-xl">
          <p className="text-gray-400 text-sm text-center">
            위치 정보가 없습니다. &apos;목록&apos; 탭에서 번역 결과를
            확인하세요.
          </p>
        </div>
      )}

      {/* 텍스트 블록 빠른 목록 (위치 정보가 있는 경우) */}
      {hasPositionData && (
        <div className="flex flex-wrap gap-2">
          {blocksWithPosition.map((block, index) => (
            <button
              key={index}
              onClick={() =>
                setSelectedBlock(selectedBlock === index ? null : index)
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedBlock === index
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="font-medium mr-1">{index + 1}.</span>
              <span className="truncate max-w-[120px] inline-block align-bottom">
                {block.translated.slice(0, 15)}
                {block.translated.length > 15 ? '...' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
