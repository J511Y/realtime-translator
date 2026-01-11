'use client';

/**
 * 양방향 실시간 통역 인터페이스
 *
 * 구글 번역 앱 스타일의 상단/하단 분할 화면으로
 * 두 화자가 마주보며 각자의 언어로 대화할 수 있습니다.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRealtimeTranslation } from '@/lib/hooks/useRealtimeTranslation';
import type {
  SupportedLanguage,
  VoiceType,
  TranslationHistoryItem,
} from '@/types/realtime';
import { ConnectionStatus } from './ConnectionStatus';
import { getLanguageInfo } from './LanguageSelector';

/** 사용 가능한 음성 목록 */
const AVAILABLE_VOICES: { value: VoiceType; label: string }[] = [
  { value: 'verse', label: 'Verse' },
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'shimmer', label: 'Shimmer' },
];

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

/** 대화 히스토리 아이템 (방향 포함) */
interface ConversationItem extends TranslationHistoryItem {
  /** 발화자 언어 (A 또는 B) */
  speaker: 'A' | 'B';
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
  // 현재 활성 화자 (A: 한국어 화자, B: 대상 언어 화자)
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);
  const [voice, setVoice] = useState<VoiceType>(defaultVoice);
  const [showSettings, setShowSettings] = useState(false);

  // 대화 히스토리 (양방향 통합)
  const [conversation, setConversation] = useState<ConversationItem[]>([]);

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
      // 번역 완료 시 대화 히스토리에 추가
      if (activeSpeaker) {
        const conversationItem: ConversationItem = {
          ...item,
          speaker: activeSpeaker,
        };
        setConversation(prev => [...prev, conversationItem].slice(-50));
      }
    },
  });

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  // Refs for auto-scroll
  const historyRefA = useRef<HTMLDivElement>(null);
  const historyRefB = useRef<HTMLDivElement>(null);

  // 히스토리 자동 스크롤
  useEffect(() => {
    if (historyRefA.current) {
      historyRefA.current.scrollTop = historyRefA.current.scrollHeight;
    }
    if (historyRefB.current) {
      historyRefB.current.scrollTop = historyRefB.current.scrollHeight;
    }
  }, [conversation]);

  /**
   * 화자 A (한국어) 시작
   */
  const handleStartSpeakerA = useCallback(async () => {
    if (isConnected) {
      disconnect();
    }
    setActiveSpeaker('A');
    await connect(languageA, languageB, voice);
  }, [isConnected, disconnect, connect, languageA, languageB, voice]);

  /**
   * 화자 B (대상 언어) 시작
   */
  const handleStartSpeakerB = useCallback(async () => {
    if (isConnected) {
      disconnect();
    }
    setActiveSpeaker('B');
    await connect(languageB, languageA, voice);
  }, [isConnected, disconnect, connect, languageA, languageB, voice]);

  /**
   * 통역 중지
   */
  const handleStop = useCallback(() => {
    disconnect();
    setActiveSpeaker(null);
  }, [disconnect]);

  /**
   * 대화 초기화
   */
  const handleClearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  const langAInfo = getLanguageInfo(languageA);
  const langBInfo = getLanguageInfo(languageB);

  // 현재 번역 중인 텍스트 (화자에 따라 다르게 표시)
  const currentInput = inputTranscript;
  const currentOutput = outputTranscript;

  return (
    <div className={`flex flex-col h-screen bg-gray-900 ${className}`}>
      {/* ========== 상단 영역 (화자 B용 - 180도 회전) ========== */}
      <div className="flex-1 flex flex-col rotate-180 border-b-4 border-gray-700">
        <SpeakerPanel
          language={languageB}
          languageInfo={langBInfo}
          otherLanguageInfo={langAInfo}
          isActive={activeSpeaker === 'B'}
          isConnected={isConnected}
          isConnecting={isConnecting && activeSpeaker === 'B'}
          translationState={translationState}
          currentInput={activeSpeaker === 'B' ? currentInput : ''}
          currentOutput={activeSpeaker === 'B' ? currentOutput : ''}
          conversation={conversation}
          speaker="B"
          onStart={handleStartSpeakerB}
          onStop={handleStop}
          historyRef={historyRefB}
          isMicMuted={isMicMuted}
          onToggleMic={toggleMicMute}
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

        <div className="flex items-center gap-2">
          {/* 설정 버튼 */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="설정"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* 대화 초기화 */}
          <button
            type="button"
            onClick={handleClearConversation}
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

      {/* 설정 패널 */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-400">음성:</label>
            <select
              value={voice}
              onChange={e => setVoice(e.target.value as VoiceType)}
              disabled={isConnected}
              className="px-3 py-1.5 text-sm bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {AVAILABLE_VOICES.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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

      {/* ========== 하단 영역 (화자 A용 - 정방향) ========== */}
      <div className="flex-1 flex flex-col">
        <SpeakerPanel
          language={languageA}
          languageInfo={langAInfo}
          otherLanguageInfo={langBInfo}
          isActive={activeSpeaker === 'A'}
          isConnected={isConnected}
          isConnecting={isConnecting && activeSpeaker === 'A'}
          translationState={translationState}
          currentInput={activeSpeaker === 'A' ? currentInput : ''}
          currentOutput={activeSpeaker === 'A' ? currentOutput : ''}
          conversation={conversation}
          speaker="A"
          onStart={handleStartSpeakerA}
          onStop={handleStop}
          historyRef={historyRefA}
          isMicMuted={isMicMuted}
          onToggleMic={toggleMicMute}
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
  isActive: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  translationState: string;
  currentInput: string;
  currentOutput: string;
  conversation: ConversationItem[];
  speaker: 'A' | 'B';
  onStart: () => void;
  onStop: () => void;
  historyRef: React.RefObject<HTMLDivElement | null>;
  isMicMuted: boolean;
  onToggleMic: () => void;
}

/**
 * 개별 화자 패널 컴포넌트
 */
function SpeakerPanel({
  languageInfo,
  otherLanguageInfo,
  isActive,
  isConnected,
  isConnecting,
  translationState,
  currentInput,
  currentOutput,
  conversation,
  speaker,
  onStart,
  onStop,
  historyRef,
  isMicMuted,
  onToggleMic,
}: SpeakerPanelProps) {
  // 이 화자에게 보여줄 대화 (상대방이 말한 것의 번역 + 내가 말한 원문)
  const relevantConversation = conversation.map(item => {
    if (item.speaker === speaker) {
      // 내가 말한 것: 원문 표시
      return {
        ...item,
        displayText: item.inputText,
        isMyMessage: true,
      };
    } else {
      // 상대방이 말한 것: 번역문 표시
      return {
        ...item,
        displayText: item.outputText,
        isMyMessage: false,
      };
    }
  });

  return (
    <div className="flex-1 flex flex-col p-4 bg-gray-900">
      {/* 언어 표시 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            {languageInfo.nativeName}
          </span>
          <span className="text-sm text-gray-400">
            → {otherLanguageInfo.nativeName}
          </span>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            활성
          </div>
        )}
      </div>

      {/* 대화 히스토리 */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0"
      >
        {relevantConversation.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            대화를 시작하세요
          </div>
        ) : (
          relevantConversation.map(item => (
            <div
              key={item.id}
              className={`flex ${item.isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  item.isMyMessage
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-700 text-gray-100 rounded-bl-md'
                }`}
              >
                {item.displayText}
              </div>
            </div>
          ))
        )}

        {/* 현재 진행 중인 번역 표시 */}
        {isActive && (currentInput || currentOutput) && (
          <div className="space-y-2 border-t border-gray-700 pt-2 mt-2">
            {currentInput && (
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-blue-600/50 text-white rounded-br-md border border-blue-500 border-dashed">
                  {currentInput}
                  {translationState === 'listening' && (
                    <span className="ml-2 inline-flex">
                      <span className="animate-pulse">●</span>
                    </span>
                  )}
                </div>
              </div>
            )}
            {currentOutput && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-green-700/50 text-green-100 rounded-bl-md border border-green-500 border-dashed">
                  {currentOutput}
                  {translationState === 'speaking' && (
                    <span className="ml-2 inline-flex">
                      <span className="animate-pulse">🔊</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center gap-4">
        {isActive && isConnected ? (
          <>
            {/* 마이크 토글 */}
            <button
              type="button"
              onClick={onToggleMic}
              className={`p-3 rounded-full transition-colors ${
                isMicMuted
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
              onClick={onStop}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
              aria-label="통역 중지"
            >
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
          </>
        ) : (
          /* 시작 버튼 */
          <button
            type="button"
            onClick={onStart}
            disabled={isConnecting}
            className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-colors shadow-lg disabled:cursor-not-allowed"
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

      {/* 안내 텍스트 */}
      <p className="text-center text-gray-500 text-xs mt-2">
        {isActive && isConnected
          ? '말씀하세요...'
          : isConnecting
            ? '연결 중...'
            : '버튼을 눌러 통역을 시작하세요'}
      </p>
    </div>
  );
}
