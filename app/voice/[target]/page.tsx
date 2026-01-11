import { notFound } from 'next/navigation';

import { DualTranslationInterface } from '@/components/realtime';
import type { SupportedLanguage } from '@/types/realtime';

/** 지원 대상 언어 목록 */
const SUPPORTED_TARGETS: SupportedLanguage[] = [
  'pt',
  'en',
  'es',
  'fr',
  'ja',
  'zh',
];

/**
 * 양방향 실시간 통역 페이지
 *
 * 한국어 ↔ 대상 언어 간 양방향 통역을 제공합니다.
 * 구글 번역 앱 스타일의 상단/하단 분할 화면 UI를 사용합니다.
 */
export default async function VoiceTranslatePage(props: {
  params: Promise<{ target: string }>;
}) {
  const { target } = await props.params;

  if (!SUPPORTED_TARGETS.includes(target as SupportedLanguage)) {
    notFound();
  }

  const targetLanguage = target as SupportedLanguage;

  return <DualTranslationInterface languageA="ko" languageB={targetLanguage} />;
}
