import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-3xl font-bold text-accent mb-4">404</div>
        <h1 className="text-lg font-bold text-[#F8FAFC]">Sahifa topilmadi</h1>
        <p className="mt-2 text-xs text-muted">
          Qidirilayotgan sahifa mavjud emas yoki o'chirilgan.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-input bg-accent px-6 py-2.5 text-xs font-medium text-white hover:bg-accent-glow transition-colors"
          >
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
