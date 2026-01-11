import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">실시간 번역</h1>
          <p className="text-gray-400 text-sm">
            포르투갈 여행을 위한 번역 도우미
          </p>
        </div>

        {/* 번역 방식 선택 */}
        <div className="space-y-4">
          <Link
            href="/voice"
            className="group block p-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                  음성 번역
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  실시간 양방향 음성 통역
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/image"
            className="group block p-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500/50 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  이미지 번역
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  사진 속 텍스트 인식 및 번역
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
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
            지원 언어
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              '🇵🇹 포르투갈어',
              '🇺🇸 영어',
              '🇪🇸 스페인어',
              '🇫🇷 프랑스어',
              '🇯🇵 일본어',
              '🇨🇳 중국어',
            ].map(lang => (
              <span
                key={lang}
                className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
