'use client';

/**
 * 오디오 시각화 컴포넌트
 *
 * 음성 입력 상태를 시각적으로 표시합니다.
 */

import { useMemo } from 'react';
import type { TranslationState } from '@/types/realtime';

export interface AudioVisualizerProps {
  /** 번역 상태 */
  translationState: TranslationState;
  /** 마이크 음소거 여부 */
  isMicMuted: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/** 바 개수 */
const BAR_COUNT = 5;

/**
 * 오디오 시각화 컴포넌트
 *
 * 상태에 따라 다른 애니메이션을 보여줍니다:
 * - idle: 정적인 바
 * - listening: 활성화된 파동 애니메이션
 * - processing: 펄스 애니메이션
 * - speaking: 출력 파동 애니메이션
 */
export function AudioVisualizer({
  translationState,
  isMicMuted,
  className = '',
}: AudioVisualizerProps) {
  /** 상태별 색상 */
  const barColor = useMemo(() => {
    if (isMicMuted) return 'bg-gray-400';

    switch (translationState) {
      case 'listening':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'speaking':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }, [translationState, isMicMuted]);

  /** 애니메이션 활성화 여부 */
  const isAnimating =
    !isMicMuted &&
    (translationState === 'listening' ||
      translationState === 'processing' ||
      translationState === 'speaking');

  return (
    <div
      className={`flex items-center justify-center gap-1 h-12 ${className}`}
      role="img"
      aria-label={`오디오 상태: ${translationState}`}
    >
      {Array.from({ length: BAR_COUNT }).map((_, index) => (
        <div
          key={index}
          className={`w-1.5 rounded-full transition-all duration-150 ${barColor} ${
            isAnimating ? 'animate-audio-wave' : ''
          }`}
          style={{
            height: isAnimating ? undefined : '8px',
            animationDelay: isAnimating ? `${index * 0.1}s` : undefined,
          }}
        />
      ))}

      {/* 음소거 아이콘 오버레이 */}
      {isMicMuted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-500"
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
        </div>
      )}
    </div>
  );
}

/**
 * 간단한 파동 애니메이션 컴포넌트
 *
 * 연결 대기 또는 로딩 상태에서 사용합니다.
 */
export function PulseIndicator({
  isActive,
  color = 'bg-blue-500',
  className = '',
}: {
  isActive: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className={`w-4 h-4 rounded-full ${color}`} />
      {isActive && (
        <>
          <div
            className={`absolute inset-0 w-4 h-4 rounded-full ${color} animate-ping opacity-75`}
          />
          <div
            className={`absolute inset-0 w-4 h-4 rounded-full ${color} animate-pulse`}
          />
        </>
      )}
    </div>
  );
}

/**
 * 마이크 레벨 인디케이터
 *
 * 실제 마이크 입력 레벨을 표시할 때 사용합니다.
 */
export function MicLevelIndicator({
  level,
  className = '',
}: {
  /** 0-100 사이의 레벨 값 */
  level: number;
  className?: string;
}) {
  const normalizedLevel = Math.max(0, Math.min(100, level));
  const barCount = 10;
  const activeCount = Math.floor((normalizedLevel / 100) * barCount);

  return (
    <div className={`flex items-end gap-0.5 h-6 ${className}`}>
      {Array.from({ length: barCount }).map((_, index) => {
        const isActive = index < activeCount;
        const height = ((index + 1) / barCount) * 100;

        // 색상 결정 (녹색 → 노란색 → 빨간색)
        let barColor = 'bg-green-500';
        if (index >= barCount * 0.7) {
          barColor = 'bg-red-500';
        } else if (index >= barCount * 0.5) {
          barColor = 'bg-yellow-500';
        }

        return (
          <div
            key={index}
            className={`w-1 rounded-sm transition-all duration-75 ${
              isActive ? barColor : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}
