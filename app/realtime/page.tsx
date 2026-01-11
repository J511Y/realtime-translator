import Link from 'next/link';

import { TranslationInterface } from '@/components/realtime';

export default function RealtimePage() {
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

        <TranslationInterface />
      </main>
    </div>
  );
}
