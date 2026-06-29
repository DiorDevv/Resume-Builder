"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const locale = useLocale();
  const { user, loading, logout } = useAuth();
  const t = useTranslations("nav");

  useEffect(() => {
    if (!loading && !user) router.push(`/${locale}/login`);
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="border-b border-border bg-surface/50 backdrop-blur-[12px]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-accent"><span className="text-xxs font-bold text-white">R</span></div>
              <span className="text-sm font-bold">Resume<span className="text-accent">Builder</span></span>
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted">
              <Link href={`/${locale}/dashboard/builder`} className="text-[#F8FAFC]">{t("builder")}</Link>
              <Link href={`/${locale}/dashboard/templates`} className="hover:text-[#F8FAFC] transition-colors">{t("templates")}</Link>
              <Link href={`/${locale}/dashboard/history`} className="hover:text-[#F8FAFC] transition-colors">{t("history")}</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden sm:block text-xxs text-muted">{user.email}</span>
            <button onClick={logout} className="rounded-input border border-border px-3 py-1.5 text-xxs text-muted hover:text-[#F8FAFC] hover:bg-surface transition-all">{t("logout")}</button>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
