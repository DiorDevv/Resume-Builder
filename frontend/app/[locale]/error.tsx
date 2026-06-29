"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-3xl font-bold text-accent mb-4">500</div>
        <h1 className="text-lg font-bold text-[#F8FAFC]">Xatolik yuz berdi</h1>
        <p className="mt-2 text-xs text-muted">
          {error.message || "Kutilmagan xatolik. Iltimos, qaytadan urinib ko'ring."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-input bg-accent px-6 py-2.5 text-xs font-medium text-white hover:bg-accent-glow transition-colors"
          >
            Qaytadan urinish
          </button>
          <Link
            href="/"
            className="rounded-input border border-border px-6 py-2.5 text-xs font-medium text-muted hover:text-[#F8FAFC] transition-colors"
          >
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
