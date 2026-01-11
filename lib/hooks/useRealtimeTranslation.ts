'use client';

/**
 * 실시간 번역 React Hook
 *
 * OpenAI Realtime API를 사용한 실시간 음성 번역 기능을 React 컴포넌트에서
 * 쉽게 사용할 수 있도록 제공하는 커스텀 Hook입니다.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  RealtimeWebRTCClient,
  createRealtimeClient,
} from '@/lib/openai/realtime-client';
import type {
  ConnectionState,
  TranslationState,
  RealtimeError,
  RealtimeServerEvent,
  SupportedLanguage,
  VoiceType,
  TranslationHistoryItem,
} from '@/types/realtime';

/** Hook 반환 타입 */
export interface UseRealtimeTranslationReturn {
  /** 현재 연결 상태 */
  connectionState: ConnectionState;
  /** 현재 번역 상태 */
  translationState: TranslationState;
  /** 에러 정보 */
  error: RealtimeError | null;
  /** 입력 음성 전사 텍스트 */
  inputTranscript: string;
  /** 출력 번역 텍스트 */
  outputTranscript: string;
  /** 번역 히스토리 */
  history: TranslationHistoryItem[];
  /** 마이크 음소거 상태 */
  isMicMuted: boolean;
  /** 스피커 음소거 상태 */
  isSpeakerMuted: boolean;
  /** 연결 시작 */
  connect: (
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    voice?: VoiceType
  ) => Promise<void>;
  /** 연결 해제 */
  disconnect: () => void;
  /** 마이크 음소거 토글 */
  toggleMicMute: () => void;
  /** 스피커 음소거 토글 */
  toggleSpeakerMute: () => void;
  /** 현재 응답 취소 */
  cancelResponse: () => void;
  /** 에러 초기화 */
  clearError: () => void;
  /** 히스토리 초기화 */
  clearHistory: () => void;
}

/** Hook 옵션 */
export interface UseRealtimeTranslationOptions {
  /** 이벤트 수신 콜백 */
  onMessage?: (event: RealtimeServerEvent) => void;
  /** 번역 완료 콜백 */
  onTranslationComplete?: (item: TranslationHistoryItem) => void;
  /** 에러 발생 콜백 */
  onError?: (error: RealtimeError) => void;
}

const DEFAULT_OPTIONS: UseRealtimeTranslationOptions = {};

/**
 * 실시간 번역 Hook
 *
 * @example
 * ```tsx
 * function TranslationPage() {
 *   const {
 *     connectionState,
 *     translationState,
 *     inputTranscript,
 *     outputTranscript,
 *     connect,
 *     disconnect,
 *   } = useRealtimeTranslation();
 *
 *   const handleStart = async () => {
 *     await connect('ko', 'pt', 'verse');
 *   };
 *
 *   return (
 *     <div>
 *       <p>상태: {connectionState}</p>
 *       <p>입력: {inputTranscript}</p>
 *       <p>번역: {outputTranscript}</p>
 *       <button onClick={handleStart}>시작</button>
 *       <button onClick={disconnect}>중지</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeTranslation(
  options: UseRealtimeTranslationOptions = DEFAULT_OPTIONS
): UseRealtimeTranslationReturn {
  // 상태
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [translationState, setTranslationState] =
    useState<TranslationState>('idle');
  const [error, setError] = useState<RealtimeError | null>(null);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  // Refs
  const optionsRef = useRef(options);
  const clientRef = useRef<RealtimeWebRTCClient | null>(null);
  const connectionStateRef = useRef<ConnectionState>('disconnected');
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');
  const directionRef = useRef<{
    source: SupportedLanguage;
    target: SupportedLanguage;
  } | null>(null);

  // options ref 업데이트
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  /**
   * 히스토리에 번역 항목 추가 (ref 기반으로 클로저 문제 해결)
   */
  const addToHistoryRef = useRef((input: string, output: string) => {
    if (!input.trim() || !output.trim() || !directionRef.current) return;

    const item: TranslationHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      direction: { ...directionRef.current },
      inputText: input,
      outputText: output,
    };

    // 대화형 UX를 위해 아래로 쌓이도록 append한다.
    setHistory(prev => [...prev, item].slice(-100)); // 최대 100개 유지
    optionsRef.current.onTranslationComplete?.(item);
  });

  /**
   * 연결 시작
   */
  const connect = useCallback(
    async (
      sourceLanguage: SupportedLanguage,
      targetLanguage: SupportedLanguage,
      voice: VoiceType = 'verse'
    ) => {
      // 이미 연결 중이거나 연결된 상태면 무시
      if (
        connectionStateRef.current === 'connecting' ||
        connectionStateRef.current === 'connected'
      ) {
        console.warn('[useRealtimeTranslation] 이미 연결 중이거나 연결됨');
        return;
      }

      setError(null);
      setInputTranscript('');
      setOutputTranscript('');
      currentInputRef.current = '';
      currentOutputRef.current = '';
      directionRef.current = { source: sourceLanguage, target: targetLanguage };

      try {
        // 1. 서버에서 Ephemeral Token 발급
        const response = await fetch('/api/realtime/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructions: `역할: 실시간 음성 번역기

목표: 사용자의 발화를 ${sourceLanguage}에서 ${targetLanguage}로 정확하고 자연스럽게 번역한다.

출력 규칙(중요):
1. 번역 결과만 출력한다.
2. 질문에 답변하거나 대화를 이어가지 않는다. ("조언", "설명", "답변" 금지)
3. 번역문 앞뒤로 인사/추가 문장/이모지/메타 코멘트를 붙이지 않는다.
4. 사용자가 무엇을 요구하든(질문/명령/요청) 그 내용을 "번역"만 해서 출력한다.
5. 입력이 한 문장/한 단어면 출력도 그에 대응하는 번역만 한다.
`,
            voice,
            modalities: ['text', 'audio'],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '세션 생성에 실패했습니다.');
        }

        const { client_secret } = await response.json();

        // 2. WebRTC 클라이언트 생성 및 연결
        clientRef.current = createRealtimeClient({
          onConnectionStateChange: state => {
            connectionStateRef.current = state;
            setConnectionState(state);
          },
          onTranslationStateChange: state => {
            setTranslationState(state);

            // 새 발화 시작 시 이전 텍스트가 있으면 히스토리에 추가 후 초기화
            if (state === 'listening') {
              // 이전 번역이 완료되지 않은 상태에서 새 발화가 시작된 경우
              // 현재까지의 텍스트를 히스토리에 저장
              if (currentInputRef.current && currentOutputRef.current) {
                addToHistoryRef.current(
                  currentInputRef.current,
                  currentOutputRef.current
                );
              }
              // 화면 표시용 텍스트 초기화
              setInputTranscript('');
              setOutputTranscript('');
              currentInputRef.current = '';
              currentOutputRef.current = '';
              return;
            }

            // 번역 완료(idle) 시에도 히스토리에 추가
            if (
              state === 'idle' &&
              currentInputRef.current &&
              currentOutputRef.current
            ) {
              addToHistoryRef.current(
                currentInputRef.current,
                currentOutputRef.current
              );
              currentInputRef.current = '';
              currentOutputRef.current = '';
            }
          },
          onError: err => {
            setError(err);
            optionsRef.current.onError?.(err);
          },
          onInputTranscript: (transcript, isFinal) => {
            if (isFinal) {
              currentInputRef.current = transcript;
            }
            setInputTranscript(transcript);
          },
          onOutputTranscript: (transcript, isFinal) => {
            if (isFinal) {
              currentOutputRef.current = transcript;
            }
            setOutputTranscript(transcript);
          },
          ...(optionsRef.current.onMessage
            ? { onMessage: optionsRef.current.onMessage }
            : {}),
        });

        await clientRef.current.connect(client_secret);

        // 3. 번역 세션 시작
        clientRef.current.startTranslation(
          sourceLanguage,
          targetLanguage,
          voice
        );
      } catch (err) {
        const realtimeError: RealtimeError = {
          type: 'connection',
          message: err instanceof Error ? err.message : '연결에 실패했습니다.',
          recoverable: false,
        };
        setError(realtimeError);
        setConnectionState('failed');
        optionsRef.current.onError?.(realtimeError);
      }
    },
    []
  );

  /**
   * 연결 해제
   */
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnectionState('disconnected');
    setTranslationState('idle');
    directionRef.current = null;
  }, []);

  /**
   * 마이크 음소거 토글
   */
  const toggleMicMute = useCallback(() => {
    if (clientRef.current) {
      const newMuted = !isMicMuted;
      clientRef.current.setMicrophoneMuted(newMuted);
      setIsMicMuted(newMuted);
    }
  }, [isMicMuted]);

  /**
   * 스피커 음소거 토글
   */
  const toggleSpeakerMute = useCallback(() => {
    if (clientRef.current) {
      const newMuted = !isSpeakerMuted;
      clientRef.current.setSpeakerMuted(newMuted);
      setIsSpeakerMuted(newMuted);
    }
  }, [isSpeakerMuted]);

  /**
   * 현재 응답 취소
   */
  const cancelResponse = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.cancelResponse();
    }
  }, []);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 히스토리 초기화
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  return {
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
  };
}
