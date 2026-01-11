/**
 * 실시간 번역 컴포넌트 모듈
 *
 * @example
 * ```tsx
 * import {
 *   TranslationInterface,
 *   ConnectionStatus,
 *   LanguageSelector,
 * } from '@/components/realtime';
 * ```
 */

export { ConnectionStatus } from './ConnectionStatus';
export type { ConnectionStatusProps } from './ConnectionStatus';

export {
  LanguageSelector,
  getLanguageInfo,
  getSupportedLanguages,
} from './LanguageSelector';
export type { LanguageSelectorProps } from './LanguageSelector';

export {
  AudioVisualizer,
  PulseIndicator,
  MicLevelIndicator,
} from './AudioVisualizer';
export type { AudioVisualizerProps } from './AudioVisualizer';

export {
  TranslationDisplay,
  TranslationHistoryCard,
  TranslationHistory,
} from './TranslationDisplay';
export type { TranslationDisplayProps } from './TranslationDisplay';

export { TranslationInterface } from './TranslationInterface';
export type { TranslationInterfaceProps } from './TranslationInterface';
