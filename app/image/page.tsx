import Link from 'next/link';
import { ImageTranslator } from '@/components/image';

export default function ImagePage() {
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">이미지 번역</h1>
          <p className="text-gray-400 text-sm">
            사진 속 텍스트를 인식하고 번역합니다
          </p>
        </div>

        <ImageTranslator defaultTargetLanguage="ko" />
      </main>
    </div>
  );
}
