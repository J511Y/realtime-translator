'use client';

/**
 * 연결 상태 표시 컴포넌트
 *
 * WebRTC 연결 상태와 번역 상태를 시각적으로 표시합니다.
 */

import type { ConnectionState, TranslationState } from '@/types/realtime';

export interface ConnectionStatusProps {
  /** WebRTC 연결 상태 */
  connectionState: ConnectionState;
  /** 번역 상태 */
  translationState: TranslationState;
  /** 추가 CSS 클래스 */
  className?: string;
}

/** 연결 상태별 설정 */
const CONNECTION_STATUS_CONFIG: Record<
  ConnectionState,
  { label: string; color: string; bgColor: string; pulse: boolean }
> = {
  disconnected: {
    label: '연결 안됨',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
    pulse: false,
  },
  connecting: {
    label: '연결 중...',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    pulse: true,
  },
  connected: {
    label: '연결됨',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    pulse: false,
  },
  reconnecting: {
    label: '재연결 중...',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    pulse: true,
  },
  failed: {
    label: '연결 실패',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    pulse: false,
  },
};

/** 번역 상태별 설정 */
const TRANSLATION_STATUS_CONFIG: Record<
  TranslationState,
  { label: string; icon: string }
> = {
  idle: { label: '대기 중', icon: '⏸️' },
  listening: { label: '듣는 중...', icon: '🎤' },
  processing: { label: '처리 중...', icon: '⚙️' },
  speaking: { label: '번역 중...', icon: '🔊' },
  error: { label: '오류 발생', icon: '⚠️' },
};

/**
 * 연결 상태 표시 컴포넌트
 */
export function ConnectionStatus({
  connectionState,
  translationState,
  className = '',
}: ConnectionStatusProps) {
  const connectionConfig = CONNECTION_STATUS_CONFIG[connectionState];
  const translationConfig = TRANSLATION_STATUS_CONFIG[translationState];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* 연결 상태 */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${connectionConfig.bgColor}`} />
          {connectionConfig.pulse && (
            <div
              className={`absolute inset-0 w-3 h-3 rounded-full ${connectionConfig.bgColor} animate-ping`}
            />
          )}
        </div>
        <span className={`text-sm font-medium ${connectionConfig.color}`}>
          {connectionConfig.label}
        </span>
      </div>

      {/* 구분선 */}
      {connectionState === 'connected' && (
        <>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

          {/* 번역 상태 */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{translationConfig.icon}</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {translationConfig.label}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
