'use client';

/**
 * 번역 결과 표시 컴포넌트
 *
 * 입력된 음성의 전사 텍스트와 번역 결과를 표시합니다.
 */

import type {
  TranslationState,
  TranslationHistoryItem,
  SupportedLanguage,
} from '@/types/realtime';
import { getLanguageInfo } from './LanguageSelector';

export interface TranslationDisplayProps {
  /** 입력 전사 텍스트 */
  inputTranscript: string;
  /** 출력 번역 텍스트 */
  outputTranscript: string;
  /** 번역 상태 */
  translationState: TranslationState;
  /** 소스 언어 */
  sourceLanguage: SupportedLanguage;
  /** 타겟 언어 */
  targetLanguage: SupportedLanguage;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 번역 결과 표시 컴포넌트
 */
export function TranslationDisplay({
  inputTranscript,
  outputTranscript,
  translationState,
  sourceLanguage,
  targetLanguage,
  className = '',
}: TranslationDisplayProps) {
  const sourceLang = getLanguageInfo(sourceLanguage);
  const targetLang = getLanguageInfo(targetLanguage);

  const isProcessing =
    translationState === 'listening' ||
    translationState === 'processing' ||
    translationState === 'speaking';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 입력 텍스트 (원문) */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {sourceLang.nativeName}
          </span>
          {translationState === 'listening' && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              듣는 중...
            </span>
          )}
        </div>
        <p
          className={`text-lg min-h-[3rem] ${
            inputTranscript
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500 italic'
          }`}
        >
          {inputTranscript || '음성을 말씀해주세요...'}
        </p>
      </div>

      {/* 화살표 구분선 */}
      <div className="flex justify-center">
        <svg
          className={`w-6 h-6 ${
            isProcessing
              ? 'text-blue-500 animate-bounce'
              : 'text-gray-400 dark:text-gray-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      {/* 출력 텍스트 (번역) */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {targetLang.nativeName}
          </span>
          {translationState === 'speaking' && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              재생 중...
            </span>
          )}
        </div>
        <p
          className={`text-xl font-medium min-h-[3rem] ${
            outputTranscript
              ? 'text-blue-900 dark:text-blue-100'
              : 'text-blue-400 dark:text-blue-500 italic'
          }`}
        >
          {outputTranscript || '번역 결과가 여기에 표시됩니다...'}
        </p>
      </div>
    </div>
  );
}

/**
 * 번역 히스토리 아이템 컴포넌트
 */
export function TranslationHistoryCard({
  item,
  className = '',
}: {
  item: TranslationHistoryItem;
  className?: string;
}) {
  const sourceLang = getLanguageInfo(item.direction.source);
  const targetLang = getLanguageInfo(item.direction.target);

  const formattedTime = new Date(item.timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{sourceLang.nativeName}</span>
          <svg
            className="w-3 h-3"
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
          <span>{targetLang.nativeName}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formattedTime}
        </span>
      </div>

      {/* 원문 */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
        {item.inputText}
      </p>

      {/* 번역문 */}
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {item.outputText}
      </p>
    </div>
  );
}

/**
 * 번역 히스토리 목록 컴포넌트
 */
export function TranslationHistory({
  history,
  onClear,
  className = '',
}: {
  history: TranslationHistoryItem[];
  onClear?: () => void;
  className?: string;
}) {
  if (history.length === 0) {
    return (
      <div
        className={`text-center text-gray-500 dark:text-gray-400 py-8 ${className}`}
      >
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">번역 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          최근 번역 ({history.length})
        </h3>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* 히스토리 목록 */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {history.map(item => (
          <TranslationHistoryCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
