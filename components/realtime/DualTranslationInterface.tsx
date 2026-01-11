'use client';

/**
 * 실시간 통역 인터페이스 (단일 마이크, 자동 연결)
 *
 * - 페이지 로드 시 자동으로 마이크 입력 시작
 * - 상단: 타겟언어 번역 히스토리 (180도 회전)
 * - 하단: 한국어 원문 히스토리
 * - 히스토리는 항상 유지됨
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRealtimeTranslation } from '@/lib/hooks/useRealtimeTranslation';
import type { SupportedLanguage, VoiceType } from '@/types/realtime';
import { ConnectionStatus } from './ConnectionStatus';
import { getLanguageInfo } from './LanguageSelector';

export interface DualTranslationInterfaceProps {
  /** 기본 언어 A (한국어 베이스) */
  languageA?: SupportedLanguage;
  /** 기본 언어 B (대상 언어) */
  languageB?: SupportedLanguage;
  /** 기본 음성 */
  defaultVoice?: VoiceType;
  /** 추가 CSS 클래스 */
  className?: string;
}

/** 히스토리 아이템 */
interface HistoryItem {
  id: string;
  timestamp: number;
  koreanText: string;
  translatedText: string;
}

/**
 * 실시간 통역 인터페이스 컴포넌트
 */
export function DualTranslationInterface({
  languageA = 'ko',
  languageB = 'pt',
  defaultVoice = 'verse',
  className = '',
}: DualTranslationInterfaceProps) {
  const [voice] = useState<VoiceType>(defaultVoice);

  // 히스토리 (컴포넌트 레벨에서 관리 - Hook과 분리)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const historyRef = useRef<HistoryItem[]>([]);

  // 실시간 번역 Hook
  const {
    connectionState,
    translationState,
    error,
    inputTranscript,
    outputTranscript,
    connect,
    disconnect,
    toggleMicMute,
    isMicMuted,
    clearError,
  } = useRealtimeTranslation({
    onTranslationComplete: item => {
      // 번역 완료 시 히스토리에 추가 (ref 사용으로 최신 상태 보장)
      const newItem: HistoryItem = {
        id: item.id,
        timestamp: item.timestamp,
        koreanText: item.inputText,
        translatedText: item.outputText,
      };
      historyRef.current = [...historyRef.current, newItem].slice(-100);
      setHistory(historyRef.current);
    },
  });

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isFailed = connectionState === 'failed';

  // Refs for auto-scroll
  const koreanHistoryRef = useRef<HTMLDivElement>(null);
  const translatedHistoryRef = useRef<HTMLDivElement>(null);

  // 자동 연결 (페이지 로드 시)
  const didAutoConnectRef = useRef(false);
  useEffect(() => {
    if (didAutoConnectRef.current) return;
    didAutoConnectRef.current = true;

    // 약간의 딜레이 후 자동 연결
    const timer = setTimeout(() => {
      connect(languageA, languageB, voice);
    }, 500);

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect, languageA, languageB, voice]);

  // 히스토리 자동 스크롤
  useEffect(() => {
    if (koreanHistoryRef.current) {
      koreanHistoryRef.current.scrollTop =
        koreanHistoryRef.current.scrollHeight;
    }
    if (translatedHistoryRef.current) {
      translatedHistoryRef.current.scrollTop =
        translatedHistoryRef.current.scrollHeight;
    }
  }, [history, inputTranscript, outputTranscript]);

  /**
   * 재연결
   */
  const handleReconnect = useCallback(async () => {
    await connect(languageA, languageB, voice);
  }, [connect, languageA, languageB, voice]);

  /**
   * 대화 초기화
   */
  const handleClearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
  }, []);

  const langAInfo = getLanguageInfo(languageA);
  const langBInfo = getLanguageInfo(languageB);

  return (
    <div className={`flex flex-col h-screen bg-gray-900 ${className}`}>
      {/* ========== 상단 영역 (타겟언어 번역 - 180도 회전) ========== */}
      <div className="flex-1 flex flex-col rotate-180 border-b-4 border-gray-700">
        <TranslationPanel
          title={langBInfo.nativeName}
          subtitle={`${langAInfo.nativeName}에서 번역됨`}
          history={history}
          historyRef={translatedHistoryRef}
          displayField="translatedText"
          currentText={outputTranscript}
          isProcessing={translationState === 'speaking'}
          processingLabel="재생 중..."
          emptyMessage="번역된 내용이 여기에 표시됩니다"
        />
      </div>

      {/* ========== 중앙 컨트롤 바 ========== */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-y border-gray-700">
        <div className="flex items-center gap-2">
          <ConnectionStatus
            connectionState={connectionState}
            translationState={translationState}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* 마이크 상태 표시 */}
          {isConnected && (
            <button
              type="button"
              onClick={toggleMicMute}
              className={`p-2 rounded-full transition-colors ${
                isMicMuted ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}
              aria-label={isMicMuted ? '마이크 켜기' : '마이크 끄기'}
            >
              {isMicMuted ? (
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
                  className="w-5 h-5"
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
          )}

          {/* 재연결 버튼 (연결 실패 시) */}
          {isFailed && (
            <button
              type="button"
              onClick={handleReconnect}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              재연결
            </button>
          )}

          {/* 대화 초기화 */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="대화 초기화"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-300">{error.message}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-red-400 hover:text-red-200"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 연결 중 표시 */}
      {isConnecting && (
        <div className="px-4 py-2 bg-blue-900/50 border-b border-blue-700">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin text-blue-400"
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
            <p className="text-sm text-blue-300">마이크 연결 중...</p>
          </div>
        </div>
      )}

      {/* ========== 하단 영역 (한국어 원문) ========== */}
      <div className="flex-1 flex flex-col">
        <TranslationPanel
          title={langAInfo.nativeName}
          subtitle="원문 (말씀하세요)"
          history={history}
          historyRef={koreanHistoryRef}
          displayField="koreanText"
          currentText={inputTranscript}
          isProcessing={translationState === 'listening'}
          processingLabel="듣는 중..."
          emptyMessage={
            isConnected ? '말씀하시면 자동으로 번역됩니다' : '연결 대기 중...'
          }
        />
      </div>
    </div>
  );
}

/** 번역 패널 Props */
interface TranslationPanelProps {
  title: string;
  subtitle: string;
  history: HistoryItem[];
  historyRef: React.RefObject<HTMLDivElement | null>;
  displayField: 'koreanText' | 'translatedText';
  currentText: string;
  isProcessing: boolean;
  processingLabel: string;
  emptyMessage: string;
}

/**
 * 번역 패널 컴포넌트
 */
function TranslationPanel({
  title,
  subtitle,
  history,
  historyRef,
  displayField,
  currentText,
  isProcessing,
  processingLabel,
  emptyMessage,
}: TranslationPanelProps) {
  return (
    <div className="flex-1 flex flex-col p-4 bg-gray-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-lg font-bold text-white">{title}</span>
          <span className="ml-2 text-sm text-gray-400">{subtitle}</span>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {processingLabel}
          </div>
        )}
      </div>

      {/* 히스토리 */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto space-y-3 min-h-0"
      >
        {history.length === 0 && !currentText ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            {emptyMessage}
          </div>
        ) : (
          <>
            {/* 저장된 히스토리 */}
            {history.map(item => (
              <div key={item.id} className="px-4 py-3 bg-gray-800 rounded-xl">
                <p className="text-white text-base leading-relaxed">
                  {item[displayField]}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}

            {/* 현재 진행 중인 텍스트 */}
            {currentText && (
              <div className="px-4 py-3 bg-blue-900/30 border border-blue-700 rounded-xl">
                <p className="text-blue-100 text-base leading-relaxed">
                  {currentText}
                  <span className="ml-1 inline-flex">
                    <span className="animate-pulse text-blue-400">●</span>
                  </span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
