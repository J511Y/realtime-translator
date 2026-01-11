'use client';

/**
 * 실시간 번역 인터페이스 메인 컴포넌트
 *
 * 모든 번역 관련 컴포넌트를 통합하여 완전한 번역 UI를 제공합니다.
 */

import { useState, useCallback } from 'react';
import { useRealtimeTranslation } from '@/lib/hooks/useRealtimeTranslation';
import type { SupportedLanguage, VoiceType } from '@/types/realtime';
import { ConnectionStatus } from './ConnectionStatus';
import { LanguageSelector } from './LanguageSelector';
import { AudioVisualizer } from './AudioVisualizer';
import { TranslationDisplay, TranslationHistory } from './TranslationDisplay';

/** 사용 가능한 음성 목록 */
const AVAILABLE_VOICES: { value: VoiceType; label: string }[] = [
  { value: 'verse', label: 'Verse (기본)' },
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

export interface TranslationInterfaceProps {
  /** 기본 소스 언어 */
  defaultSourceLanguage?: SupportedLanguage;
  /** 기본 타겟 언어 */
  defaultTargetLanguage?: SupportedLanguage;
  /** 기본 음성 */
  defaultVoice?: VoiceType;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 실시간 번역 인터페이스 컴포넌트
 */
export function TranslationInterface({
  defaultSourceLanguage = 'ko',
  defaultTargetLanguage = 'pt',
  defaultVoice = 'verse',
  className = '',
}: TranslationInterfaceProps) {
  // 언어 및 음성 설정
  const [sourceLanguage, setSourceLanguage] = useState<SupportedLanguage>(
    defaultSourceLanguage
  );
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(
    defaultTargetLanguage
  );
  const [voice, setVoice] = useState<VoiceType>(defaultVoice);
  const [showHistory, setShowHistory] = useState(false);

  // 실시간 번역 Hook
  const {
    connectionState,
    translationState,
    error,
    inputTranscript,
    outputTranscript,
    history,
    isMicMuted,
    isSpeakerMuted,
    connect,
    disconnect,
    toggleMicMute,
    toggleSpeakerMute,
    cancelResponse,
    clearError,
    clearHistory,
  } = useRealtimeTranslation();

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  /**
   * 번역 시작/중지 핸들러
   */
  const handleToggleConnection = useCallback(async () => {
    if (isConnected || isConnecting) {
      disconnect();
    } else {
      await connect(sourceLanguage, targetLanguage, voice);
    }
  }, [
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sourceLanguage,
    targetLanguage,
    voice,
  ]);

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          실시간 번역
        </h1>
        <ConnectionStatus
          connectionState={connectionState}
          translationState={translationState}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error.message}
              </p>
              {error.recoverable && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  다시 시도해주세요.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
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
        </div>
      )}

      {/* 설정 패널 */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* 언어 선택 */}
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceChange={setSourceLanguage}
          onTargetChange={setTargetLanguage}
          disabled={isConnected || isConnecting}
          className="mb-4"
        />

        {/* 음성 선택 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="voice-select"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              음성
            </label>
            <select
              id="voice-select"
              value={voice}
              onChange={e => setVoice(e.target.value as VoiceType)}
              disabled={isConnected || isConnecting}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {AVAILABLE_VOICES.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* 히스토리 토글 버튼 */}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`mt-5 p-2 rounded-lg transition-colors ${
              showHistory
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            aria-label="번역 기록"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      {isConnected ? (
        <>
          {/* 오디오 시각화 */}
          <div className="mb-6 flex justify-center">
            <AudioVisualizer
              translationState={translationState}
              isMicMuted={isMicMuted}
            />
          </div>

          {/* 번역 결과 표시 */}
          <TranslationDisplay
            inputTranscript={inputTranscript}
            outputTranscript={outputTranscript}
            translationState={translationState}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            className="mb-6"
          />

          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* 마이크 토글 */}
            <button
              type="button"
              onClick={toggleMicMute}
              className={`p-4 rounded-full transition-colors ${
                isMicMuted
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-label={isMicMuted ? '마이크 켜기' : '마이크 끄기'}
            >
              {isMicMuted ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </button>

            {/* 중지 버튼 */}
            <button
              type="button"
              onClick={handleToggleConnection}
              className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              aria-label="번역 중지"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </button>

            {/* 스피커 토글 */}
            <button
              type="button"
              onClick={toggleSpeakerMute}
              className={`p-4 rounded-full transition-colors ${
                isSpeakerMuted
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-label={isSpeakerMuted ? '스피커 켜기' : '스피커 끄기'}
            >
              {isSpeakerMuted ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* 현재 응답 취소 버튼 */}
          {translationState === 'speaking' && (
            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={cancelResponse}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                응답 취소
              </button>
            </div>
          )}
        </>
      ) : (
        /* 시작 버튼 */
        <div className="flex flex-col items-center py-12">
          <button
            type="button"
            onClick={handleToggleConnection}
            disabled={isConnecting}
            className="p-8 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-colors shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            aria-label="번역 시작"
          >
            {isConnecting ? (
              <svg
                className="w-12 h-12 animate-spin"
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
            ) : (
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isConnecting ? '연결 중...' : '버튼을 눌러 번역을 시작하세요'}
          </p>
        </div>
      )}

      {/* 히스토리 패널 */}
      {showHistory && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <TranslationHistory history={history} onClear={clearHistory} />
        </div>
      )}
    </div>
  );
}
