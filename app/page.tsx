import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          실시간 번역
        </h1>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          번역 방식을 선택하세요.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/voice"
            className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                <svg
                  className="h-5 w-5"
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
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  음성 번역
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  한국어 음성을 선택한 언어로 실시간 번역합니다.
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/image"
            className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  이미지 번역
                </div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  사진 속 텍스트를 인식하고 번역합니다.
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
