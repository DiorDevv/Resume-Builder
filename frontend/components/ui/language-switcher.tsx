"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const locales = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (newLocale: string) => {
    const segments = pathname.split("/");
    const currentLocale = segments[1] || "uz";
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => switchTo(l.code)}
          className={`rounded-badge px-2 py-0.5 text-xxs transition-all ${
            locale === l.code
              ? "bg-accent text-white"
              : "text-muted hover:text-[#F8FAFC] hover:bg-surface"
          }`}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
