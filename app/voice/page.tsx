import Link from 'next/link';

import type { SupportedLanguage } from '@/types/realtime';

/** 대상 언어 목록 */
const TARGET_LANGUAGES: Array<{
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}> = [
  { code: 'pt', label: '포르투갈어', nativeName: 'Português' },
  { code: 'en', label: '영어', nativeName: 'English' },
  { code: 'es', label: '스페인어', nativeName: 'Español' },
  { code: 'fr', label: '프랑스어', nativeName: 'Français' },
  { code: 'ja', label: '일본어', nativeName: '日本語' },
  { code: 'zh', label: '중국어', nativeName: '中文' },
];

/**
 * 음성 통역 언어 선택 페이지
 *
 * 한국어 ↔ 대상 언어 양방향 실시간 통역을 위한 언어 선택
 */
export default function VoiceLanguageSelectPage() {
  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            홈으로
          </Link>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            실시간 양방향 통역
          </h1>
          <p className="text-gray-400 text-sm">
            한국어와 대화할 언어를 선택하세요
          </p>
        </div>

        {/* 기본 언어 표시 */}
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">한</span>
            </div>
            <div>
              <div className="text-white font-medium">한국어</div>
              <div className="text-blue-400 text-xs">기본 언어 (고정)</div>
            </div>
          </div>
        </div>

        {/* 화살표 */}
        <div className="flex justify-center mb-6">
          <div className="p-2 bg-gray-800 rounded-full">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>
        </div>

        {/* 대상 언어 선택 */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-3">대화 상대 언어 선택:</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TARGET_LANGUAGES.map(lang => (
            <Link
              key={lang.code}
              href={`/voice/${lang.code}`}
              className="group p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl transition-all"
            >
              <div className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                {lang.nativeName}
              </div>
              <div className="text-sm text-gray-400 mt-1">{lang.label}</div>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <span>한국어</span>
                <svg
                  className="w-4 h-4 mx-1"
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
                <span>{lang.nativeName}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 안내 */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-xl">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            사용 방법
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 핸드폰을 마주보고 놓으세요</li>
            <li>• 상단은 상대방, 하단은 본인용입니다</li>
            <li>• 각자 버튼을 눌러 말하면 실시간 통역됩니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
