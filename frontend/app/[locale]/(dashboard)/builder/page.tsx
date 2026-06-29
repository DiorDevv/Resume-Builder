"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSection } from "@/components/builder/sortable-section";
import { PersonalInfoForm, WorkExperienceForm, EducationForm, SkillsForm, ProjectsForm, CertificationsForm, LanguagesForm } from "@/components/builder/section-forms";
import { ResumePreview } from "@/components/preview/resume-preview";
import { useAutoSave } from "@/lib/use-auto-save";
import { apiFetch } from "@/lib/api";

interface SectionData {
  id: string;
  section_type: string;
  sort_order: number;
  title: string | null;
  data: Record<string, unknown>;
}

const SECTION_LABELS: Record<string, string> = {
  personal_info: "Shaxsiy ma'lumotlar",
  work_experience: "Ish tajribasi",
  education: "Ta'lim",
  skills: "Ko'nikmalar",
  projects: "Loyihalar",
  certifications: "Sertifikatlar",
  languages: "Tillar",
};

const DEFAULT_SECTIONS = [
  "personal_info",
  "work_experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
];

function getDefaultData(sectionType: string): Record<string, unknown> {
  switch (sectionType) {
    case "personal_info":
      return { full_name: "", email: "", phone: "", city: "", linkedin: "", github: "", portfolio: "", summary: "" };
    case "work_experience":
      return { items: [] };
    case "education":
      return { items: [] };
    case "skills":
      return { technical: [], languages: [], soft: [] };
    case "projects":
      return { items: [] };
    case "certifications":
      return { items: [] };
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
    if (s.section_type === "skills") {
      const skills = d as { technical?: string[] };
      return (skills.technical?.length ?? 0) > 0;
    }
    return true;
  }).length;
  return Math.round((filled / sections.length) * 100);
}

export default function BuilderPage() {
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { debouncedSave, saving, lastSaved } = useAutoSave(resumeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<{ resumes: Array<{ id: string }> }>("/api/v1/resumes");

        let rid: string;
        if (list.resumes.length > 0) {
          rid = list.resumes[0].id;
        } else {
          const created = await apiFetch<{ id: string }>("/api/v1/resumes", {
            method: "POST",
            body: JSON.stringify({ title: "Mening CV" }),
          });
          rid = created.id;
        }

        setResumeId(rid);

        const resume = await apiFetch<{
          id: string;
          sections: SectionData[];
        }>(`/api/v1/resumes/${rid}`);

        let existingSections = resume.sections || [];

        for (const st of DEFAULT_SECTIONS) {
          if (!existingSections.some((s) => s.section_type === st)) {
            const created = await apiFetch<SectionData>(
              `/api/v1/resumes/${rid}/sections`,
              {
                method: "POST",
                body: JSON.stringify({
                  section_type: st,
                  sort_order: DEFAULT_SECTIONS.indexOf(st),
                  data: getDefaultData(st),
                }),
              }
            );
            existingSections = [...existingSections, created];
          }
        }

        existingSections.sort((a, b) => a.sort_order - b.sort_order);
        setSections(existingSections);

        apiFetch(`/api/v1/ats/score/${rid}`).catch(() => {});
      } catch (err) {
        console.error("Failed to load resume:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSection = useCallback(
    (sectionType: string, newData: Record<string, unknown>) => {
      setSections((prev) => {
        const updated = prev.map((s) =>
          s.section_type === sectionType ? { ...s, data: newData } : s
        );

        const changed = updated.find((s) => s.section_type === sectionType);
        if (changed) {
          debouncedSave({ sections: [{ id: changed.id, data: newData }] });
        }

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
            method: "PUT",
            body: JSON.stringify({ section_ids: sectionIds }),
          }).catch(console.error);
        }

        return reordered;
      });
    },
    [resumeId]
  );

  const progress = useMemo(() => computeProgress(sections), [sections]);

  const previewData = useMemo(() => {
    const obj: Record<string, unknown> = {};
    for (const s of sections) {
      obj[s.section_type] = s.data;
    }
    return obj;
  }, [sections]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 overflow-y-auto border-r border-border p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-[#F8FAFC]">CV Builder</h1>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xxs text-muted">{progress}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xxs text-muted">
              {saving && <span className="text-warning">Saqlamoqda...</span>}
              {lastSaved && !saving && <span>Saqlandi</span>}
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(
                    `${
                      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                    }/api/v1/export/resume/${resumeId}/pdf?template=classic`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
                  );
                  if (!res.ok) throw new Error("Export failed");
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "CV.pdf";
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  alert("PDF yuklashda xatolik: " + (e as Error).message);
                }
              }}
              className="rounded-input bg-accent px-3 py-1.5 text-xxs font-medium text-white hover:bg-accent-glow transition-all"
            >
              PDF yuklab olish
            </button>
          </div>
        </div>

        {/* Sections */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSection key={section.id} id={section.id} label={SECTION_LABELS[section.section_type] || section.section_type}>
                  {section.section_type === "personal_info" && (
                    <PersonalInfoForm
                      data={section.data as Record<string, string>}
                      onChange={(d) => updateSection("personal_info", d)}
                    />
                  )}
                  {section.section_type === "work_experience" && (
                    <WorkExperienceForm
                      data={section.data as { items: Array<Record<string, unknown>> }}
                      onChange={(d) => updateSection("work_experience", d)}
                    />
                  )}
                  {section.section_type === "education" && (
                    <EducationForm
                      data={section.data as { items: Array<Record<string, unknown>> }}
                      onChange={(d) => updateSection("education", d)}
                    />
                  )}
                  {section.section_type === "skills" && (
                    <SkillsForm
                      data={section.data as { technical: string[]; languages: Array<{ language: string; level: string }>; soft: string[] }}
                      onChange={(d) => updateSection("skills", d)}
                    />
                  )}
                  {section.section_type === "projects" && (
                    <ProjectsForm
                      data={section.data as { items: Array<Record<string, unknown>> }}
                      onChange={(d) => updateSection("projects", d)}
                    />
                  )}
                  {section.section_type === "certifications" && (
                    <CertificationsForm
                      data={section.data as { items: Array<Record<string, unknown>> }}
                      onChange={(d) => updateSection("certifications", d)}
                    />
                  )}
                  {section.section_type === "languages" && (
                    <LanguagesForm
                      data={section.data as { items: Array<{ language: string; level: string }> }}
                      onChange={(d) => updateSection("languages", d)}
                    />
                  )}
                </SortableSection>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Right: Preview */}
      <div className="w-full lg:w-1/2 overflow-y-auto p-4 lg:p-6 bg-primary/50">
        <ResumePreview data={previewData} />
      </div>
    </div>
  );
}
