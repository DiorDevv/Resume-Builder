"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading, register, error, clearError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(`/${locale}/builder`);
  }, [user, router, locale]);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setValidationError("Email kiritish majburiy");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Email formati noto'g'ri");
      return false;
    }
    if (password.length < 8) {
      setValidationError("Parol kamida 8 belgidan iborat bo'lishi kerak");
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setValidationError("Parol kamida bitta katta harfni o'z ichiga olishi kerak");
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setValidationError("Parol kamida bitta kichik harfni o'z ichiga olishi kerak");
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setValidationError("Parol kamida bitta raqamni o'z ichiga olishi kerak");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Parollar mos kelmadi");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await register(email, password, fullName || undefined);
      router.push(`/${locale}/login`);
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-sm"
      >
        <div className="glass rounded-card p-8 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <Link href={`/${locale}`} className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
                <span className="text-xxs font-bold text-white">R</span>
              </div>
            </Link>
            <LanguageSwitcher />
          </div>

          <h1 className="text-sm font-bold text-[#F8FAFC]">{t("welcome")}</h1>
          <p className="mt-1 text-xs text-muted">{t("registerSub")}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xxs font-medium text-muted mb-1">
                {t("fullName")} <span className="text-muted/50">({t("optional")})</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aliyev Alisher"
                autoComplete="name"
                className="w-full rounded-input bg-primary border border-border px-4 py-2.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xxs font-medium text-muted mb-1">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="alisher@example.com"
                autoComplete="email"
                autoFocus
                className="w-full rounded-input bg-primary border border-border px-4 py-2.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xxs font-medium text-muted mb-1">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 8 belgi, katta/kichik harf va raqam"
                autoComplete="new-password"
                className="w-full rounded-input bg-primary border border-border px-4 py-2.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xxs font-medium text-muted mb-1">
                {t("confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-input bg-primary border border-border px-4 py-2.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {(error || validationError) && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xxs text-red-400 bg-red-500/10 rounded-input px-3 py-2"
              >
                {validationError || error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-input bg-accent py-2.5 text-xs font-medium text-white hover:bg-accent-glow transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {t("registerBtn")}
            </button>
          </form>

          <p className="mt-6 text-center text-xxs text-muted">
            {t("hasAccount")}{" "}
            <Link href={`/${locale}/login`} className="text-accent hover:text-accent-glow transition-colors">
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
