"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const NAV_ITEMS = ["builder", "templates", "history"] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, loading, logout } = useAuth();
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentPath = pathname.replace(`/${locale}/`, "").replace(/\/$/, "") || "builder";

  useEffect(() => {
    if (mounted && !loading && !user) router.replace(`/${locale}/login`);
  }, [user, loading, router, locale, mounted]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push(`/${locale}/login`);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xxs text-muted animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-surface/80 backdrop-blur-[12px]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}`} className="flex items-center gap-2 group shrink-0">
              <motion.div whileHover={{ rotate: -10, scale: 1.1 }} className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
                <span className="text-xxs font-bold text-white">R</span>
              </motion.div>
              <span className="text-sm font-bold text-[#F8FAFC] hidden sm:inline">Resume<span className="text-accent">Builder</span></span>
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item;
                return (
                  <Link
                    key={item}
                    href={`/${locale}/${item}`}
                    className={`relative px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                      isActive
                        ? "text-[#F8FAFC] bg-accent/10"
                        : "text-muted hover:text-[#F8FAFC] hover:bg-surface"
                    }`}
                  >
                    {t(item)}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-accent rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-accent/5 border border-border/30">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xxs text-muted max-w-[120px] truncate">{user.full_name || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-input border border-border/50 px-3 py-1.5 text-xxs text-muted hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-200 disabled:opacity-50"
              >
                {loggingOut ? "Chiqmoqda..." : t("logout")}
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-md border border-border/50 text-muted hover:text-[#F8FAFC]"
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t border-border/50 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = currentPath === item;
                  return (
                    <Link
                      key={item}
                      href={`/${locale}/${item}`}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-3 py-2 text-xs rounded-md transition-all ${
                        isActive ? "text-[#F8FAFC] bg-accent/10" : "text-muted hover:text-[#F8FAFC] hover:bg-surface"
                      }`}
                    >
                      {t(item)}
                    </Link>
                  );
                })}
                <div className="border-t border-border/30 my-2" />
                <div className="flex items-center gap-2 px-3 py-2 text-xxs text-muted">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{(user.full_name || user.email).charAt(0).toUpperCase()}</span>
                  </div>
                  {user.email}
                </div>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  disabled={loggingOut}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/5 rounded-md transition-colors"
                >
                  {t("logout")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
