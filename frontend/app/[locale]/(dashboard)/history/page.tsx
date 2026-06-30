"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface ResumeItem {
  id: string;
  title: string;
  language: string;
  is_completed: boolean;
  ats_score: number | null;
  updated_at: string;
}

export default function HistoryPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("history");

  const loadResumes = () => {
    apiFetch<{ resumes: ResumeItem[] }>("/api/v1/resumes")
      .then((data) => setResumes(data.resumes))
      .catch((err) => console.error("Resumes yuklanmadi:", err))
      .finally(() => setLoading(false));
  };

  useEffect(loadResumes, []);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/v1/resumes/${id}`, { method: "DELETE" });
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      console.error("Delete failed");
    }
    setDeleteId(null);
  };

  const handleDownload = async (id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(
      `${baseUrl}/api/v1/export/resume/${id}/pdf?template=classic`,
      { credentials: "include" }
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CV.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-sm font-bold text-[#F8FAFC]">{t("title")}</h1>
          <p className="mt-1 text-xs text-muted">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/builder`)}
          className="rounded-input bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-glow transition-all"
        >
          {t("newCv")}
        </button>
      </motion.div>

      {resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#F8FAFC]">{t("empty")}</h2>
          <p className="mt-2 text-xs text-muted">{t("emptyDesc")}</p>
          <button
            onClick={() => router.push(`/${locale}/builder`)}
            className="mt-4 rounded-input bg-accent px-6 py-2 text-xs font-medium text-white hover:bg-accent-glow transition-all"
          >
            {t("createFirst")}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {resumes.map((resume, i) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-card p-4 flex items-center justify-between group hover:border-accent/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#F8FAFC] truncate">{resume.title}</h3>
                    <span className={`rounded-badge px-2 py-0.5 text-[10px] font-medium ${
                      resume.is_completed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {resume.is_completed ? t("statusCompleted") : t("statusDraft")}
                    </span>
                    <span className="rounded-badge bg-accent/10 px-2 py-0.5 text-[10px] text-accent uppercase">
                      {resume.language}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xxs text-muted">
                    <span>{formatDate(resume.updated_at)}</span>
                    {resume.ats_score !== null && (
                      <span className={resume.ats_score >= 60 ? "text-success" : "text-warning"}>
                        ATS: {resume.ats_score}/100
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => router.push(`/${locale}/builder`)}
                    className="rounded-input border border-border px-3 py-1.5 text-xxs text-muted hover:text-[#F8FAFC] hover:bg-surface transition-all"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDownload(resume.id)}
                    className="rounded-input bg-accent/10 px-3 py-1.5 text-xxs text-accent hover:bg-accent/20 transition-all"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setDeleteId(resume.id)}
                    className="rounded-input px-3 py-1.5 text-xxs text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    {t("delete")}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-card p-6 max-w-sm mx-4"
            >
              <h3 className="text-sm font-bold text-[#F8FAFC]">{t("deleteConfirm")}</h3>
              <p className="mt-2 text-xs text-muted">{t("deleteDesc")}</p>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-input border border-border px-4 py-2 text-xs text-muted hover:text-[#F8FAFC] transition-all"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="rounded-input bg-red-500 px-4 py-2 text-xs text-white hover:bg-red-600 transition-all"
                >
                  {t("confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
