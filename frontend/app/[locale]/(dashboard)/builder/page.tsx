"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { SortableSection } from "@/components/builder/sortable-section";
import { ErrorBoundary } from "@/components/builder/error-boundary";
import { PersonalInfoForm, WorkExperienceForm, EducationForm, SkillsForm, ProjectsForm, CertificationsForm, LanguagesForm } from "@/components/builder/section-forms";
import { ResumePreview } from "@/components/preview/resume-preview";
import { useAutoSave } from "@/lib/use-auto-save";
import { apiFetch, ApiError } from "@/lib/api";

interface SectionData {
  id: string;
  section_type: string;
  sort_order: number;
  title: string | null;
  data: Record<string, unknown>;
}

interface ResumeSummary {
  id: string;
  title: string;
  language: string;
  is_completed: boolean;
  ats_score: number | null;
  updated_at: string;
}

const DEFAULT_SECTIONS = [
  "personal_info", "work_experience", "education", "skills",
  "projects", "certifications", "languages",
];

function getDefaultData(sectionType: string): Record<string, unknown> {
  switch (sectionType) {
    case "personal_info":
      return { full_name: "", email: "", phone: "", city: "", linkedin: "", github: "", portfolio: "", summary: "" };
    case "work_experience": case "education": case "projects": case "certifications":
      return { items: [] };
    case "skills":
      return { technical: [], languages: [], soft: [] };
    case "languages":
      return { items: [] };
    default:
      return {};
  }
}

function computeProgress(sections: SectionData[]): number {
  if (sections.length === 0) return 0;
  const filled = sections.filter((s) => {
    const d = s.data;
    if (s.section_type === "personal_info") return !!(d.full_name && d.email);
    if (s.section_type === "work_experience") return (d.items as Array<unknown>)?.length > 0;
    if (s.section_type === "education") return (d.items as Array<unknown>)?.length > 0;
    if (s.section_type === "skills") return ((d.technical as string[])?.length ?? 0) > 0;
    return true;
  }).length;
  return Math.round((filled / sections.length) * 100);
}

interface ResumeSelectorProps {
  resumes: ResumeSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

function ResumeSelector({ resumes, activeId, onSelect, onCreate }: ResumeSelectorProps) {
  const t = useTranslations("builder");
  const [open, setOpen] = useState(false);
  const active = resumes.find((r) => r.id === activeId);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-input bg-surface border border-border px-3 py-1.5 text-xs text-[#F8FAFC] hover:border-accent/50 transition-all"
      >
        <FileText className="h-3.5 w-3.5 text-accent" />
        <span className="truncate max-w-[120px]">{active?.title || t("selectResume")}</span>
        <svg className={`h-3 w-3 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 mt-1 w-56 z-50 glass rounded-card border border-border overflow-hidden"
          >
            <div className="p-1 space-y-0.5">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onSelect(r.id); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all ${
                    r.id === activeId
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-[#F8FAFC] hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{r.title}</span>
                  </div>
                  {r.id === activeId && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
              <div className="border-t border-border/50 my-1" />
              <button
                onClick={() => { onCreate(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent hover:bg-accent/5 rounded-md transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("newResume")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BuilderPage() {
  const t = useTranslations("builder");
  const searchParams = useSearchParams();
  const defaultTemplate = searchParams.get("template") || undefined;
  const [resumeList, setResumeList] = useState<ResumeSummary[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { debouncedSave, saving, lastSaved } = useAutoSave(resumeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadResume = useCallback(async (rid: string) => {
    setLoading(true);
    try {
      const resume = await apiFetch<{ id: string; sections: SectionData[] }>(`/api/v1/resumes/${rid}`);
      let existingSections = resume.sections || [];

      if (existingSections.length === 0) {
        for (const st of DEFAULT_SECTIONS) {
          const created = await apiFetch<SectionData>(
            `/api/v1/resumes/${rid}/sections`,
            { method: "POST", body: JSON.stringify({ section_type: st, sort_order: DEFAULT_SECTIONS.indexOf(st), data: getDefaultData(st) }) }
          );
          existingSections = [...existingSections, created];
        }
      }

      existingSections.sort((a, b) => a.sort_order - b.sort_order);
      setSections(existingSections);
      setResumeId(rid);
      apiFetch(`/api/v1/ats/score/${rid}`).catch((err) => console.error("ATS score yuklanmadi:", err));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "CV yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<{ resumes: ResumeSummary[] }>("/api/v1/resumes");
        if (cancelled) return;
        setResumeList(list.resumes);
        if (list.resumes.length > 0) {
          await loadResume(list.resumes[0].id);
        } else {
          const created = await apiFetch<{ id: string }>("/api/v1/resumes", {
            method: "POST", body: JSON.stringify({ title: "Mening CV" }),
          });
          if (cancelled) return;
          setResumeList([{ id: created.id, title: "Mening CV", language: "uz", is_completed: false, ats_score: null, updated_at: new Date().toISOString() }]);
          await loadResume(created.id);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "CV yuklashda xatolik");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadResume]);

  const handleCreateNew = async () => {
    try {
      const created = await apiFetch<{ id: string }>("/api/v1/resumes", {
        method: "POST", body: JSON.stringify({ title: `Mening CV ${resumeList.length + 1}` }),
      });
      setResumeList((prev) => [...prev, { id: created.id, title: `Mening CV ${resumeList.length + 1}`, language: "uz", is_completed: false, ats_score: null, updated_at: new Date().toISOString() }]);
      await loadResume(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yangi CV yaratishda xatolik");
    }
  };

  const handleSelectResume = async (id: string) => {
    await loadResume(id);
  };

  const updateSection = useCallback(
    (sectionType: string, newData: Record<string, unknown>) => {
      setSections((prev) => {
        const updated = prev.map((s) =>
          s.section_type === sectionType ? { ...s, data: newData } : s
        );
        const changed = updated.find((s) => s.section_type === sectionType);
        if (changed) debouncedSave({ sections: [{ id: changed.id, data: newData }] });
        return updated;
      });
    },
    [debouncedSave]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        const sectionIds = reordered.map((s) => s.id);
        if (resumeId) {
          apiFetch(`/api/v1/resumes/${resumeId}/sections/reorder`, {
            method: "PUT", body: JSON.stringify({ section_ids: sectionIds }),
          }).catch((err) => console.error("Reorder failed:", err));
        }
        return reordered;
      });
    },
    [resumeId]
  );

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (!resumeId) return;
    try {
      await apiFetch(`/api/v1/resumes/${resumeId}/sections/${sectionId}`, { method: "DELETE" });
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sektsiyani o'chirishda xatolik");
    }
  }, [resumeId]);

  const handleDownloadPdf = async () => {
    if (!resumeId) return;
    setPdfLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${baseUrl}/api/v1/export/resume/${resumeId}/pdf?template=classic`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "PDF yuklashda xatolik" }));
        throw new Error(err.detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CV.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF yuklab bo'lmadi");
    } finally {
      setPdfLoading(false);
    }
  };

  const progress = useMemo(() => computeProgress(sections), [sections]);
  const previewData = useMemo(() => {
    const obj: Record<string, unknown> = {};
    for (const s of sections) obj[s.section_type] = s.data;
    return obj;
  }, [sections]);

  if (loading && sections.length === 0) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xxs text-muted animate-pulse">CV yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#F8FAFC]">Xatolik yuz berdi</h2>
          <p className="mt-2 text-xs text-muted">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-input bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-glow transition-all">
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-input bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400 flex items-center gap-2 shadow-lg backdrop-blur-sm"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
              <button onClick={() => setError(null)} className="ml-2 hover:text-red-300 transition-colors">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full lg:w-1/2 overflow-y-auto border-r border-border/50 p-4 lg:p-6 max-h-[50vh] lg:max-h-none">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ResumeSelector
                resumes={resumeList}
                activeId={resumeId}
                onSelect={handleSelectResume}
                onCreate={handleCreateNew}
              />
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xxs text-muted">{progress}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xxs">
                {saving ? (
                  <span className="text-warning flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                    {t("saving")}
                  </span>
                ) : lastSaved ? (
                  <span className="text-success flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {t("saved")}
                  </span>
                ) : null}
              </div>
              <motion.button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-input bg-accent px-3 py-1.5 text-xxs font-medium text-white hover:bg-accent-glow transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {pdfLoading ? (
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                )}
                {t("downloadPdf")}
              </motion.button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
                {sections.map((section, i) => (
                  <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <SortableSection id={section.id} onDelete={() => handleDeleteSection(section.id)}>
                      {section.section_type === "personal_info" && (
                        <PersonalInfoForm data={section.data as Record<string, string>} onChange={(d) => updateSection("personal_info", d)} />
                      )}
                      {section.section_type === "work_experience" && (
                        <WorkExperienceForm data={section.data as { items: Array<Record<string, unknown>> }} onChange={(d) => updateSection("work_experience", d)} />
                      )}
                      {section.section_type === "education" && (
                        <EducationForm data={section.data as { items: Array<Record<string, unknown>> }} onChange={(d) => updateSection("education", d)} />
                      )}
                      {section.section_type === "skills" && (
                        <SkillsForm data={section.data as { technical: string[]; languages: Array<{ language: string; level: string }>; soft: string[] }} onChange={(d) => updateSection("skills", d)} />
                      )}
                      {section.section_type === "projects" && (
                        <ProjectsForm data={section.data as { items: Array<Record<string, unknown>> }} onChange={(d) => updateSection("projects", d)} />
                      )}
                      {section.section_type === "certifications" && (
                        <CertificationsForm data={section.data as { items: Array<Record<string, unknown>> }} onChange={(d) => updateSection("certifications", d)} />
                      )}
                      {section.section_type === "languages" && (
                        <LanguagesForm data={section.data as { items: Array<{ language: string; level: string }> }} onChange={(d) => updateSection("languages", d)} />
                      )}
                    </SortableSection>
                  </motion.div>
                ))}
              </motion.div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="w-full lg:w-1/2 overflow-y-auto bg-primary/30 p-4 lg:p-6">
          <div className="sticky top-0">
            <ResumePreview data={previewData} defaultTemplate={defaultTemplate as "classic" | "modern" | "minimal" | undefined} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
