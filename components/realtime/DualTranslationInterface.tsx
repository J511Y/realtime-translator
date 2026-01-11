'use client';

/**
 * 양방향 실시간 통역 인터페이스
 *
 * - 상단: 타겟언어 화자용 패널 (180도 회전)
 * - 하단: 한국어 화자용 패널
 * - 각 패널에 마이크 버튼으로 발화 시작
 * - 모바일 최적화 (전체 화면 사용)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeTranslation } from '@/lib/hooks/useRealtimeTranslation';
import type { SupportedLanguage, VoiceType } from '@/types/realtime';
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
  speaker: 'A' | 'B';
  originalText: string;
  translatedText: string;
}

/**
 * 양방향 실시간 통역 인터페이스 컴포넌트
 */
export function DualTranslationInterface({
  languageA = 'ko',
  languageB = 'pt',
  defaultVoice = 'verse',
  className = '',
}: DualTranslationInterfaceProps) {
  const router = useRouter();
  const [voice] = useState<VoiceType>(defaultVoice);

  // 현재 활성 화자 (A: 한국어, B: 타겟언어)
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);
  const activeSpeakerRef = useRef<'A' | 'B' | null>(null);

  // 히스토리 (컴포넌트 레벨에서 관리)
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
    clearError,
  } = useRealtimeTranslation({
    onTranslationComplete: item => {
      // 번역 완료 시 히스토리에 추가
      const speaker = activeSpeakerRef.current;
      if (!speaker) return;

      const newItem: HistoryItem = {
        id: item.id,
        timestamp: item.timestamp,
        speaker,
        originalText: item.inputText,
        translatedText: item.outputText,
      };
      historyRef.current = [...historyRef.current, newItem].slice(-100);
      setHistory([...historyRef.current]);
    },
  });

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  // Refs for auto-scroll
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);

  // activeSpeaker ref 동기화
  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  // 히스토리 자동 스크롤
  useEffect(() => {
    if (panelARef.current) {
      panelARef.current.scrollTop = panelARef.current.scrollHeight;
    }
    if (panelBRef.current) {
      panelBRef.current.scrollTop = panelBRef.current.scrollHeight;
    }
  }, [history, inputTranscript, outputTranscript]);

  const sharedCurrentInput = activeSpeaker ? inputTranscript : '';
  const sharedCurrentOutput = activeSpeaker ? outputTranscript : '';

  // 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /**
   * 한국어 화자 (A) 마이크 시작
   */
  const handleStartSpeakerA = useCallback(async () => {
    if (isConnected) {
      disconnect();
    }
    setActiveSpeaker('A');
    activeSpeakerRef.current = 'A';
    await connect(languageA, languageB, voice);
  }, [isConnected, disconnect, connect, languageA, languageB, voice]);

  /**
   * 타겟언어 화자 (B) 마이크 시작
   */
  const handleStartSpeakerB = useCallback(async () => {
    if (isConnected) {
      disconnect();
    }
    setActiveSpeaker('B');
    activeSpeakerRef.current = 'B';
    await connect(languageB, languageA, voice);
  }, [isConnected, disconnect, connect, languageA, languageB, voice]);

  /**
   * 마이크 중지
   */
  const handleStop = useCallback(() => {
    disconnect();
    setActiveSpeaker(null);
    activeSpeakerRef.current = null;
  }, [disconnect]);

  /**
   * 대화 초기화
   */
  const handleClearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
  }, []);

  /**
   * 뒤로가기
   */
  const handleBack = useCallback(() => {
    disconnect();
    router.push('/voice');
  }, [disconnect, router]);

  const langAInfo = getLanguageInfo(languageA);
  const langBInfo = getLanguageInfo(languageB);

  return (
    <div
      className={`flex flex-col h-[100dvh] bg-gray-900 overflow-hidden ${className}`}
    >
      {/* ========== 상단 패널 (타겟언어 화자 B - 180도 회전) ========== */}
      <div className="flex-1 min-h-0 flex flex-col rotate-180 border-b-2 border-gray-600">
        <SpeakerPanel
          language={languageB}
          languageInfo={langBInfo}
          otherLanguageInfo={langAInfo}
          speaker="B"
          activeSpeaker={activeSpeaker}
          isConnected={isConnected}
          isConnecting={isConnecting && activeSpeaker === 'B'}
          translationState={translationState}
          history={history}
          currentInput={sharedCurrentInput}
          currentOutput={sharedCurrentOutput}
          historyRef={panelBRef}
          onStart={handleStartSpeakerB}
          onStop={handleStop}
        />
      </div>

      {/* ========== 중앙 컨트롤 바 (최소화) ========== */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-y border-gray-700">
        <button
          type="button"
          onClick={handleBack}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="뒤로가기"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>{langAInfo.nativeName}</span>
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
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span>{langBInfo.nativeName}</span>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
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

      {/* 에러 메시지 */}
      {error && (
        <div className="px-3 py-1.5 bg-red-900/50 border-b border-red-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-300">{error.message}</p>
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

      {/* ========== 하단 패널 (한국어 화자 A) ========== */}
      <div className="flex-1 min-h-0 flex flex-col">
        <SpeakerPanel
          language={languageA}
          languageInfo={langAInfo}
          otherLanguageInfo={langBInfo}
          speaker="A"
          activeSpeaker={activeSpeaker}
          isConnected={isConnected}
          isConnecting={isConnecting && activeSpeaker === 'A'}
          translationState={translationState}
          history={history}
          currentInput={sharedCurrentInput}
          currentOutput={sharedCurrentOutput}
          historyRef={panelARef}
          onStart={handleStartSpeakerA}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}

/** 화자 패널 Props */
interface SpeakerPanelProps {
  language: SupportedLanguage;
  languageInfo: { code: string; name: string; nativeName: string };
  otherLanguageInfo: { code: string; name: string; nativeName: string };
  speaker: 'A' | 'B';
  activeSpeaker: 'A' | 'B' | null;
  isConnected: boolean;
  isConnecting: boolean;
  translationState: string;
  history: HistoryItem[];
  currentInput: string;
  currentOutput: string;
  historyRef: React.RefObject<HTMLDivElement | null>;
  onStart: () => void;
  onStop: () => void;
}

/**
 * 화자별 패널 컴포넌트
 */
function SpeakerPanel({
  languageInfo,
  otherLanguageInfo,
  speaker,
  activeSpeaker,
  isConnected,
  isConnecting,
  translationState,
  history,
  currentInput,
  currentOutput,
  historyRef,
  onStart,
  onStop,
}: SpeakerPanelProps) {
  const isActive = activeSpeaker === speaker;
  const isOtherActive = activeSpeaker !== null && activeSpeaker !== speaker;

  // 이 패널에 표시할 히스토리 필터링
  // - 내가 말한 것: 번역된 텍스트 (상대방이 볼 내용)
  // - 상대방이 말한 것: 번역된 텍스트 (내가 볼 내용)
  const displayHistory = history.map(item => ({
    ...item,
    displayText:
      item.speaker === speaker ? item.originalText : item.translatedText,
    isMyMessage: item.speaker === speaker,
  }));

  return (
    <div className="flex-1 flex flex-col p-3 bg-gray-900 min-h-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">
            {languageInfo.nativeName}
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {translationState === 'listening'
                ? '듣는 중'
                : translationState === 'speaking'
                  ? '재생 중'
                  : '활성'}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          → {otherLanguageInfo.nativeName}
        </span>
      </div>

      {/* 히스토리 영역 */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3"
      >
        {displayHistory.length === 0 && !currentInput && !currentOutput ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            마이크 버튼을 눌러 말씀하세요
          </div>
        ) : (
          <>
            {displayHistory.map(item => (
              <div
                key={item.id}
                className={`flex ${item.isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    item.isMyMessage
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {item.displayText}
                </div>
              </div>
            ))}

            {/* 현재 진행 중인 텍스트 */}
            {isActive && currentInput && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-blue-500/50 text-blue-100 rounded-br-sm border border-blue-400 border-dashed">
                  {currentInput}
                  <span className="ml-1 animate-pulse">●</span>
                </div>
              </div>
            )}
            {currentOutput && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-green-700/50 text-green-100 rounded-bl-sm border border-green-500 border-dashed">
                  {currentOutput}
                  <span className="ml-1 animate-pulse">🔊</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 마이크 버튼 */}
      <div className="flex justify-center shrink-0">
        {isActive && isConnected ? (
          <button
            type="button"
            onClick={onStop}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg flex items-center justify-center active:scale-95"
            aria-label="통역 중지"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={isConnecting || isOtherActive}
            className={`w-16 h-16 rounded-full transition-all shadow-lg flex items-center justify-center active:scale-95 ${
              isConnecting
                ? 'bg-blue-400 text-white cursor-wait'
                : isOtherActive
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            aria-label="통역 시작"
          >
            {isConnecting ? (
              <svg
                className="w-8 h-8 animate-spin"
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
                className="w-8 h-8"
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
      </div>
    </div>
  );
}
