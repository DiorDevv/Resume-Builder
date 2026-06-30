'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ZoomIn, Maximize2, Minimize2, FileText } from "lucide-react";
import { ATSPanel } from "./ats-panel";

interface PreviewProps {
  data: Record<string, unknown>;
}

type TemplateKey = "classic" | "modern" | "minimal";

const TEMPLATES: Record<TemplateKey, { label: string; description: string }> = {
  classic: { label: "Classic", description: "Klassik uslub" },
  modern: { label: "Modern", description: "Zamonaviy uslub" },
  minimal: { label: "Minimal", description: "Oddiy uslub" },
};

function TemplateTabs({
  active,
  onChange,
}: {
  active: TemplateKey;
  onChange: (t: TemplateKey) => void;
}) {
  return (
    <div className="flex gap-1 rounded-input bg-surface border border-border p-0.5">
      {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 rounded-[5px] px-3 py-1.5 text-xxs font-medium transition-all ${
            active === key
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:text-[#F8FAFC]"
          }`}
        >
          {TEMPLATES[key].label}
        </button>
      ))}
    </div>
  );
}

function ZoomSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <ZoomIn className="h-3.5 w-3.5 text-muted" />
      <input
        type="range"
        min={0.5}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 h-1 rounded-full bg-surface appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
      />
      <span className="text-xxs text-muted tabular-nums w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

const templateStyles: Record<TemplateKey, string> = {
  classic:
    "space-y-5",
  modern:
    "space-y-6",
  minimal:
    "space-y-4",
};

const sectionTitleStyles: Record<TemplateKey, string> = {
  classic:
    "text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2",
  modern:
    "text-xs font-semibold text-[#F8FAFC] border-l-2 border-accent pl-2 mb-3",
  minimal:
    "text-xs font-semibold text-[#F8FAFC] mb-2",
};

const itemStyles: Record<TemplateKey, string> = {
  classic: "",
  modern: "border-l border-border/50 pl-3",
  minimal: "",
};

const dateStyles: Record<TemplateKey, string> = {
  classic: "text-xxs text-muted text-right whitespace-nowrap",
  modern: "text-xxs text-accent/70 whitespace-nowrap",
  minimal: "text-xxs text-muted/60 whitespace-nowrap",
};

export function ResumePreview({ data }: PreviewProps) {
  const [template, setTemplate] = useState<TemplateKey>("classic");
  const [zoom, setZoom] = useState(0.8);
  const [atsVisible, setAtsVisible] = useState(true);

  const info = (data.personal_info || data.personalInfo || {}) as Record<string, unknown>;
  const workData = (data.work_experience || data.workExperience || {}) as { items?: Array<Record<string, unknown>> };
  const work = workData.items || [];
  const eduData = (data.education || {}) as { items?: Array<Record<string, unknown>> };
  const edu = eduData.items || [];
  const skills = (data.skills || {
    technical: [],
    languages: [],
    soft: [],
  }) as { technical: string[]; languages: Array<{ language: string; level: string }>; soft: string[] };
  const projectsData = (data.projects || {}) as { items?: Array<Record<string, unknown>> };
  const projects = projectsData.items || [];
  const certsData = (data.certifications || {}) as { items?: Array<Record<string, unknown>> };
  const certs = certsData.items || [];
  const langsData = (data.languages || data.languagesSection || {}) as { items?: Array<{ language: string; level: string }> };
  const langs = langsData.items || [];

  const hasContent =
    info.full_name ||
    work.length > 0 ||
    edu.length > 0 ||
    skills.technical.length > 0;

  const s = (v: unknown) => String(v ?? "");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-2">
        <TemplateTabs active={template} onChange={setTemplate} />
        <div className="flex items-center gap-1">
          <ZoomSlider value={zoom} onChange={setZoom} />
          <button
            type="button"
            onClick={() => setAtsVisible(!atsVisible)}
            className={`rounded-input p-1.5 transition-all ${
              atsVisible
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-[#F8FAFC] hover:bg-surface"
            }`}
            title={atsVisible ? "ATS panelni yashirish" : "ATS panelni ko'rsatish"}
          >
            {atsVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {atsVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-3"
          >
            <ATSPanel data={data} />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex-1 overflow-hidden"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          width: zoom < 1 ? `${100 / zoom}%` : "100%",
          height: zoom < 1 ? `${100 / zoom}%` : "100%",
        }}
      >
        <div className="h-full glass rounded-card p-6 overflow-y-auto">
          {!hasContent ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                <div className="text-sm text-muted">CV ingiz bo'sh</div>
                <div className="text-xxs text-muted/50 mt-1">
                  Chapdagi formalarni to'ldiring
                </div>
              </div>
            </div>
          ) : (
            <div className={templateStyles[template]}>
              {info.full_name ? (
                <div>
                  <h2 className="text-base font-bold text-[#F8FAFC]">
                    {s(info.full_name)}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xxs text-muted">
                    {info.email ? <span>{s(info.email)}</span> : null}
                    {info.phone ? <span>{s(info.phone)}</span> : null}
                    {info.city ? <span>{s(info.city)}</span> : null}
                  </div>
                  {info.linkedin || info.github ? (
                    <div className="mt-1 flex gap-3 text-xxs text-accent">
                      {info.linkedin ? <span>{s(info.linkedin)}</span> : null}
                      {info.github ? <span>{s(info.github)}</span> : null}
                    </div>
                  ) : null}
                  {info.summary ? (
                    <p className={`mt-2 text-xxs leading-relaxed ${
                      template === "minimal" ? "text-muted/70" : "text-muted"
                    }`}>
                      {s(info.summary)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {work.length > 0 && (
                <div>
                  <h3 className={sectionTitleStyles[template]}>
                    Ish tajribasi
                  </h3>
                  <div className={`space-y-3 ${itemStyles[template]}`}>
                    {work.map((item, i) => (
                      <div key={i}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xxs font-medium text-[#F8FAFC]">
                              {s(item.position)}
                            </div>
                            <div className="text-xxs text-accent">
                              {s(item.company)}
                            </div>
                          </div>
                          <div className={dateStyles[template]}>
                            {s(item.start_date)}{" "}
                            {item.is_current
                              ? "— Hozir"
                              : item.end_date
                                ? `— ${s(item.end_date)}`
                                : ""}
                          </div>
                        </div>
                        {item.description ? (
                          <p className={`mt-1 text-xxs leading-relaxed ${
                            template === "minimal" ? "text-muted/70" : "text-muted"
                          }`}>
                            {s(item.description)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {edu.length > 0 && (
                <div>
                  <h3 className={sectionTitleStyles[template]}>
                    Ta&apos;lim
                  </h3>
                  <div className={`space-y-2 ${itemStyles[template]}`}>
                    {edu.map((item, i) => (
                      <div key={i}>
                        <div className="text-xxs font-medium text-[#F8FAFC]">
                          {s(item.university)}
                        </div>
                        <div className="text-xxs text-muted">
                          {item.degree ? s(item.degree) : null}
                          {item.field ? `, ${s(item.field)}` : ""}
                        </div>
                        <div className="text-xxs text-muted">
                          {s(item.start_year)} — {s(item.end_year)}
                          {item.gpa ? ` | GPA: ${s(item.gpa)}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(skills.technical.length > 0 ||
                skills.languages.length > 0 ||
                skills.soft.length > 0) && (
                <div>
                  <h3 className={sectionTitleStyles[template]}>
                    Ko&apos;nikmalar
                  </h3>
                  {skills.technical.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {skills.technical.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-badge bg-accent/10 px-2 py-0.5 text-xxs text-accent"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {skills.languages.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xxs text-muted mb-1">
                      {skills.languages.map((l, i) => (
                        <span key={i}>
                          {l.language} ({l.level})
                        </span>
                      ))}
                    </div>
                  )}
                  {skills.soft.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.soft.map((skill, i) => (
                        <span
                          key={i}
                          className="rounded-badge bg-surface border border-border px-2 py-0.5 text-xxs text-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {projects.length > 0 && (
                <div>
                  <h3 className={sectionTitleStyles[template]}>
                    Loyihalar
                  </h3>
                  <div className={`space-y-2 ${itemStyles[template]}`}>
                    {projects.map((item, i) => (
                      <div key={i}>
                        <div className="text-xxs font-medium text-[#F8FAFC]">
                          {s(item.name)}
                        </div>
                        {item.description ? (
                          <p className={`text-xxs ${
                            template === "minimal" ? "text-muted/70" : "text-muted"
                          }`}>{s(item.description)}</p>
                        ) : null}
                        {(item.technologies as string[] | string) ? (
                          <div className="text-xxs text-accent">
                            {Array.isArray(item.technologies) ? (item.technologies as string[]).join(", ") : s(item.technologies)}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {certs.length > 0 && (
                <div>
                  <h3 className={sectionTitleStyles[template]}>
                    Sertifikatlar
                  </h3>
                  <div className={`space-y-1 ${itemStyles[template]}`}>
                    {certs.map((item, i) => (
                      <div key={i} className="text-xxs">
                        <span className="text-[#F8FAFC]">{s(item.name)}</span>
                        <span className="text-muted"> — {s(item.issuer)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {langs.length > 0 && (
                <div>
                  <h3 className={sectionTitleStyles[template]}>
                    Tillar
                  </h3>
                  <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xxs ${
                    template === "minimal" ? "text-muted/70" : "text-muted"
                  }`}>
                    {langs.map((item, i) => (
                      <span key={i}>
                        {item.language} ({item.level})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
