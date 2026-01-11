import Link from 'next/link';

export default function ImagePage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            홈으로
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          이미지 번역
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          준비 중입니다.
        </p>
      </main>
    </div>
  );
}
