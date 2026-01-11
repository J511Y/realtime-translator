import Link from 'next/link';
import { ImageTranslator } from '@/components/image';

export default function ImagePage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            <svg
              className="h-4 w-4"
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

        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          이미지 번역
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          사진 속 텍스트를 인식하고 번역합니다.
        </p>

        <ImageTranslator defaultTargetLanguage="ko" />
      </main>
    </div>
  );
}
