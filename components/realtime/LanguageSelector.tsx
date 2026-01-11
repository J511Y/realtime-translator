'use client';

/**
 * 언어 선택 컴포넌트
 *
 * 번역할 소스 언어와 타겟 언어를 선택합니다.
 */

import { useCallback } from 'react';
import type { SupportedLanguage, LanguageInfo } from '@/types/realtime';

/** 지원 언어 목록 */
const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

export interface LanguageSelectorProps {
  /** 소스 언어 */
  sourceLanguage: SupportedLanguage;
  /** 타겟 언어 */
  targetLanguage: SupportedLanguage;
  /** 소스 언어 변경 콜백 */
  onSourceChange: (language: SupportedLanguage) => void;
  /** 타겟 언어 변경 콜백 */
  onTargetChange: (language: SupportedLanguage) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 언어 선택 컴포넌트
 */
export function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  disabled = false,
  className = '',
}: LanguageSelectorProps) {
  /**
   * 언어 스왑 핸들러
   */
  const handleSwap = useCallback(() => {
    const tempSource = sourceLanguage;
    onSourceChange(targetLanguage);
    onTargetChange(tempSource);
  }, [sourceLanguage, targetLanguage, onSourceChange, onTargetChange]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 소스 언어 선택 */}
      <div className="flex-1">
        <label
          htmlFor="source-language"
          className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >
          입력 언어
        </label>
        <select
          id="source-language"
          value={sourceLanguage}
          onChange={e => onSourceChange(e.target.value as SupportedLanguage)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option
              key={lang.code}
              value={lang.code}
              disabled={lang.code === targetLanguage}
            >
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>

      {/* 스왑 버튼 */}
      <button
        type="button"
        onClick={handleSwap}
        disabled={disabled}
        className="mt-5 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="언어 교환"
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
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>

      {/* 타겟 언어 선택 */}
      <div className="flex-1">
        <label
          htmlFor="target-language"
          className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
        >
          출력 언어
        </label>
        <select
          id="target-language"
          value={targetLanguage}
          onChange={e => onTargetChange(e.target.value as SupportedLanguage)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option
              key={lang.code}
              value={lang.code}
              disabled={lang.code === sourceLanguage}
            >
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * 언어 코드로 언어 정보 가져오기
 */
export function getLanguageInfo(code: SupportedLanguage): LanguageInfo {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  if (!lang) {
    throw new Error(`지원하지 않는 언어 코드: ${code}`);
  }
  return lang;
}

/**
 * 지원 언어 목록 반환
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return SUPPORTED_LANGUAGES;
}
