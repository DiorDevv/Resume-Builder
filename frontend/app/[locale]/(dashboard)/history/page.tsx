"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Trash2, Download,
  ArrowUpDown, ChevronDown, X,
} from "lucide-react";
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

type FilterMode = "all" | "completed" | "draft";
type SortMode = "newest" | "oldest" | "ats" | "az";

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="glass rounded-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xxs text-muted">{label}</div>
        <div className="text-sm font-bold text-[#F8FAFC]">{value}</div>
      </div>
    </div>
  );
}

function computeProgress(resume: ResumeItem): number {
  if (resume.is_completed) return 100;
  if (resume.ats_score !== null) return Math.min(resume.ats_score, 80);
  return 15;
}

export default function HistoryPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [showSort, setShowSort] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      console.error("Delete failed");
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    for (const id of selected) {
      try { await apiFetch(`/api/v1/resumes/${id}`, { method: "DELETE" }); }
      catch { /* skip */ }
    }
    setResumes((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
  };

  const handleDownload = async (id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
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
    } catch {}
  };

  const handleBulkExport = async () => {
    for (const id of selected) await handleDownload(id);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const stats = useMemo(() => {
    const total = resumes.length;
    const completed = resumes.filter((r) => r.is_completed).length;
    const drafts = total - completed;
    const scores = resumes.map((r) => r.ats_score).filter((s) => s !== null) as number[];
    const avgAts = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { total, completed, drafts, avgAts };
  }, [resumes]);

  const filtered = useMemo(() => {
    let result = [...resumes];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }

    if (filter === "completed") result = result.filter((r) => r.is_completed);
    else if (filter === "draft") result = result.filter((r) => !r.is_completed);

    result.sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "ats": return (b.ats_score ?? 0) - (a.ats_score ?? 0);
        case "az": return a.title.localeCompare(b.title);
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [resumes, search, filter, sort]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-[#F8FAFC]">{t("title")}</h1>
            <p className="mt-1 text-xs text-muted">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/builder`)}
            className="rounded-input bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-glow transition-all flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("newCv")}
          </button>
        </div>

        {resumes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <StatsCard label={t("statsTotal")} value={stats.total} icon={<FileText className="h-5 w-5 text-accent" />} color="bg-accent/10" />
            <StatsCard label={t("statsAts")} value={`${stats.avgAts}/100`} icon={<ArrowUpDown className="h-5 w-5 text-purple-400" />} color="bg-purple-500/10" />
            <StatsCard label={t("statsCompleted")} value={stats.completed} icon={<Download className="h-5 w-5 text-success" />} color="bg-success/10" />
            <StatsCard label={t("statsDrafts")} value={stats.drafts} icon={<FileText className="h-5 w-5 text-warning" />} color="bg-warning/10" />
          </motion.div>
        )}
      </motion.div>

      {resumes.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-input bg-surface border border-border pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent transition-all"
              />
            </div>

            <div className="flex gap-1 rounded-input bg-surface border border-border p-0.5">
              {(["all", "completed", "draft"] as FilterMode[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-[5px] px-3 py-1.5 text-xxs font-medium transition-all ${
                    filter === f ? "bg-accent text-white shadow-sm" : "text-muted hover:text-[#F8FAFC]"
                  }`}
                >
                  {t(f === "all" ? "filterAll" : f === "completed" ? "filterCompleted" : "filterDraft")}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 rounded-input bg-surface border border-border px-3 py-2 text-xxs text-muted hover:text-[#F8FAFC] transition-all"
              >
                <ArrowUpDown className="h-3 w-3" />
                {t(`sort${sort.charAt(0).toUpperCase()}${sort.slice(1)}`)}
                <ChevronDown className={`h-3 w-3 transition-transform ${showSort ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1 w-36 z-20 glass rounded-card border border-border overflow-hidden"
                  >
                    {(["newest", "oldest", "ats", "az"] as SortMode[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSort(s); setShowSort(false); }}
                        className={`w-full text-left px-3 py-2 text-xxs transition-all ${
                          sort === s ? "text-accent bg-accent/5" : "text-muted hover:text-[#F8FAFC] hover:bg-surface"
                        }`}
                      >
                        {t(`sort${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 px-3 py-2 glass rounded-card"
              >
                <span className="text-xxs text-muted">{selected.size} {t("selected")}</span>
                <button onClick={handleBulkDelete} className="flex items-center gap-1 text-xxs text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 className="h-3 w-3" /> {t("bulkDelete")}
                </button>
                <button onClick={handleBulkExport} className="flex items-center gap-1 text-xxs text-accent hover:text-accent-glow transition-colors">
                  <Download className="h-3 w-3" /> {t("bulkExport")}
                </button>
                <button onClick={() => setSelected(new Set())} className="ml-auto text-muted hover:text-[#F8FAFC] transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <FileText className="h-8 w-8 text-accent" />
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
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((resume, i) => {
              const progress = computeProgress(resume);
              return (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass rounded-card overflow-hidden group hover:border-accent/30 transition-all ${
                    selected.has(resume.id) ? "border-accent/50" : ""
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(resume.id)}
                        onChange={() => toggleSelect(resume.id)}
                        className="h-4 w-4 rounded border-border bg-primary text-accent focus:ring-accent shrink-0 cursor-pointer"
                      />
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
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex-1 max-w-xs">
                            <div className="h-1 rounded-full bg-surface overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full rounded-full ${
                                  progress >= 100
                                    ? "bg-success"
                                    : progress >= 50
                                      ? "bg-accent"
                                      : "bg-warning"
                                }`}
                              />
                            </div>
                          </div>
                          <span className="text-xxs text-muted tabular-nums">{formatDate(resume.updated_at)}</span>
                          {resume.ats_score !== null && (
                            <span className={`text-xxs tabular-nums ${
                              resume.ats_score >= 60 ? "text-success" : "text-warning"
                            }`}>
                              ATS: {resume.ats_score}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
