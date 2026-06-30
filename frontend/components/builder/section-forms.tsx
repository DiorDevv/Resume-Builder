"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, GripVertical, Plus, Trash2,
  User, Briefcase, GraduationCap, Code2, FolderGit2, Award, Globe,
} from "lucide-react";
import { useDragHandle } from "@/components/builder/sortable-section";

const SECTION_CONFIG = {
  personal_info:    { icon: User,          color: "#6366F1", label: "Shaxsiy ma'lumotlar" },
  work_experience:  { icon: Briefcase,     color: "#10B981", label: "Ish tajribasi" },
  education:        { icon: GraduationCap, color: "#3B82F6", label: "Ta'lim" },
  skills:           { icon: Code2,         color: "#8B5CF6", label: "Ko'nikmalar" },
  projects:         { icon: FolderGit2,    color: "#F97316", label: "Loyihalar" },
  certifications:   { icon: Award,         color: "#F59E0B", label: "Sertifikatlar" },
  languages:        { icon: Globe,         color: "#06B6D4", label: "Tillar" },
} as const;

type SectionType = keyof typeof SECTION_CONFIG;

interface CollapsibleCardProps {
  sectionType: SectionType;
  data?: Record<string, unknown>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function computeProgress(sectionType: SectionType, data?: Record<string, unknown>): { filled: number; total: number } | null {
  if (!data) return null;
  switch (sectionType) {
    case "personal_info": {
      const fields = ["full_name", "email", "phone", "city", "linkedin", "github", "portfolio", "summary"];
      const filled = fields.filter((f) => (data[f] as string)?.trim().length > 0).length;
      return { filled, total: fields.length };
    }
    case "work_experience":
    case "education":
    case "projects":
    case "certifications": {
      const items = (data.items as Array<Record<string, unknown>>) || [];
      const filled = items.filter((item) => {
        if (sectionType === "work_experience") return !!(item.company || item.position);
        if (sectionType === "education") return !!(item.university || item.degree);
        if (sectionType === "projects") return !!(item.name);
        if (sectionType === "certifications") return !!(item.name);
        return false;
      }).length;
      return { filled, total: Math.max(items.length || 1, 1) };
    }
    case "skills": {
      const technical = (data.technical as string[]) || [];
      const languages = (data.languages as Array<unknown>) || [];
      const soft = (data.soft as string[]) || [];
      const filled = [technical.length > 0, languages.length > 0, soft.length > 0].filter(Boolean).length;
      return { filled, total: 3 };
    }
    case "languages": {
      const langItems = (data.items as Array<Record<string, unknown>>) || [];
      const filled = langItems.filter((l) => (l.language as string)?.trim().length > 0).length;
      return { filled, total: Math.max(langItems.length || 1, 1) };
    }
    default:
      return null;
  }
}

const progressVariant = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
};

function ProgressBadge({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? filled / total : 0;
  return (
    <motion.span
      variants={progressVariant}
      initial="initial"
      animate="animate"
      className={`text-xxs font-medium tabular-nums ${
        pct === 0 ? "text-muted/50" : pct >= 1 ? "text-success" : "text-muted"
      }`}
    >
      {filled}/{total}
    </motion.span>
  );
}

export function CollapsibleCard({
  sectionType,
  data,
  defaultOpen = true,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const dragCtx = useDragHandle();
  const config = SECTION_CONFIG[sectionType];
  const progress = computeProgress(sectionType, data);

  return (
    <div className="glass rounded-card overflow-hidden relative">
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px]"
        style={{ backgroundColor: config.color }}
      />
      <div className="pl-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between pr-4 py-3 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            {dragCtx && (
              <button
                type="button"
                {...dragCtx.attributes}
                {...dragCtx.listeners}
                className="cursor-grab active:cursor-grabbing text-muted hover:text-[#F8FAFC] transition-colors shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            {config && (
              <config.icon className="h-4 w-4 shrink-0" style={{ color: config.color }} />
            )}
            <span className="text-xs font-semibold text-[#F8FAFC] truncate">
              {config?.label || sectionType}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {progress && <ProgressBadge filled={progress.filled} total={progress.total} />}
            {dragCtx?.onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); dragCtx.onDelete?.(); }}
                className="text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pr-4 pb-4 space-y-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline,
  type = "text",
  disabled,
  maxLength,
}: FieldProps) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  const charsLeft = maxLength ? maxLength - value.length : null;
  const pct = maxLength ? value.length / maxLength : 0;
  const counterColor =
    pct > 1 ? "text-red-400" : pct > 0.9 ? "text-warning" : "text-muted/60";

  return (
    <div>
      <label htmlFor={id} className="block text-xxs font-medium text-muted mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => {
            if (maxLength && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all resize-none disabled:opacity-50"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all disabled:opacity-50"
        />
      )}
      {multiline && charsLeft !== null && (
        <div className="flex justify-end mt-1">
          <span className={`text-xxs tabular-nums ${counterColor}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}

export function PersonalInfoForm({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (d: Record<string, string>) => void;
}) {
  const set = (key: string) => (val: string) => onChange({ ...data, [key]: val });

  return (
    <CollapsibleCard sectionType="personal_info" data={data as unknown as Record<string, unknown>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="To'liq ism" placeholder="Aliyev Alisher" value={data.full_name || ""} onChange={set("full_name")} />
        <Field label="Email" placeholder="alisher@example.com" value={data.email || ""} onChange={set("email")} type="email" />
        <Field label="Telefon" placeholder="+998 90 123 45 67" value={data.phone || ""} onChange={set("phone")} type="tel" />
        <Field label="Shahar" placeholder="Toshkent" value={data.city || ""} onChange={set("city")} />
        <Field label="LinkedIn" placeholder="linkedin.com/in/..." value={data.linkedin || ""} onChange={set("linkedin")} />
        <Field label="GitHub" placeholder="github.com/..." value={data.github || ""} onChange={set("github")} />
        <div className="col-span-2">
          <Field label="Portfolio" placeholder="https://..." value={data.portfolio || ""} onChange={set("portfolio")} />
        </div>
        <div className="col-span-2">
          <Field
            label="Professional summary"
            placeholder="FastAPI, PostgreSQL, Docker bilan ishlovchi backend dasturchi..."
            value={data.summary || ""}
            onChange={set("summary")}
            multiline
            maxLength={500}
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}

function ItemCard({
  sectionType,
  index,
  children,
  onRemove,
}: {
  sectionType: SectionType;
  index: number;
  children: React.ReactNode;
  onRemove: () => void;
}) {
  const config = SECTION_CONFIG[sectionType];
  return (
    <div
      className="rounded-input bg-primary/50 border border-border p-3 space-y-2"
      style={{ borderLeftColor: config?.color || "#6366F1", borderLeftWidth: 2 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xxs font-medium text-muted flex items-center gap-1.5">
          {config && <config.icon className="h-3 w-3" style={{ color: config.color }} />}
          {config?.label} #{index + 1}
        </span>
        <button type="button" onClick={onRemove} className="text-muted hover:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

export function WorkExperienceForm({
  data,
  onChange,
}: {
  data: { items: Array<Record<string, unknown>> };
  onChange: (d: { items: Array<Record<string, unknown>> }) => void;
}) {
  const items = data.items || [];

  const addItem = () => {
    onChange({
      items: [
        ...items,
        { company: "", position: "", start_date: "", end_date: "", is_current: false, description: "", bullet_points: [] },
      ],
    });
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onChange({ items: updated });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <CollapsibleCard sectionType="work_experience" data={data as unknown as Record<string, unknown>}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <ItemCard key={i} sectionType="work_experience" index={i} onRemove={() => removeItem(i)}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kompaniya" placeholder="Uzum" value={String(item.company || "")} onChange={(v) => updateItem(i, "company", v)} />
              <Field label="Lavozim" placeholder="Backend dasturchi" value={String(item.position || "")} onChange={(v) => updateItem(i, "position", v)} />
              <Field label="Boshlanish sanasi" placeholder="2023-01" value={String(item.start_date || "")} onChange={(v) => updateItem(i, "start_date", v)} />
              <Field label="Tugash sanasi" placeholder="2024-06" value={String(item.end_date || "")} onChange={(v) => updateItem(i, "end_date", v)} disabled={!!item.is_current} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!item.is_current}
                onChange={(e) => updateItem(i, "is_current", e.target.checked)}
                className="h-4 w-4 rounded border-border bg-primary text-accent focus:ring-accent"
              />
              <span className="text-xxs text-muted">Hozirda ishlayapman</span>
            </label>
            <Field
              label="Vazifalar"
              placeholder="Mikroservislarni loyihalash va ishlab chiqish..."
              value={String(item.description || "")}
              onChange={(v) => updateItem(i, "description", v)}
              multiline
              maxLength={1000}
            />
          </ItemCard>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex w-full items-center justify-center gap-2 rounded-input border border-dashed border-border py-2 text-xxs text-muted hover:text-accent hover:border-accent transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Tajriba qo'shish
        </button>
      </div>
    </CollapsibleCard>
  );
}

export function EducationForm({
  data,
  onChange,
}: {
  data: { items: Array<Record<string, unknown>> };
  onChange: (d: { items: Array<Record<string, unknown>> }) => void;
}) {
  const items = data.items || [];

  const addItem = () => {
    onChange({
      items: [...items, { university: "", degree: "", field: "", start_year: "", end_year: "", gpa: "" }],
    });
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onChange({ items: updated });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <CollapsibleCard sectionType="education" data={data as unknown as Record<string, unknown>}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <ItemCard key={i} sectionType="education" index={i} onRemove={() => removeItem(i)}>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Field label="Universitet" placeholder="Toshkent Axborot Texnologiyalari Universiteti" value={String(item.university || "")} onChange={(v) => updateItem(i, "university", v)} />
              </div>
              <Field label="Daraja" placeholder="Bakalavr" value={String(item.degree || "")} onChange={(v) => updateItem(i, "degree", v)} />
              <Field label="Yo'nalish" placeholder="Kompyuter injiniringi" value={String(item.field || "")} onChange={(v) => updateItem(i, "field", v)} />
              <Field label="Boshlanish yili" placeholder="2019" value={String(item.start_year || "")} onChange={(v) => updateItem(i, "start_year", v)} />
              <Field label="Tugash yili" placeholder="2023" value={String(item.end_year || "")} onChange={(v) => updateItem(i, "end_year", v)} />
              <div className="col-span-2">
                <Field label="GPA (ixtiyoriy)" placeholder="4.0" value={String(item.gpa || "")} onChange={(v) => updateItem(i, "gpa", v)} />
              </div>
            </div>
          </ItemCard>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex w-full items-center justify-center gap-2 rounded-input border border-dashed border-border py-2 text-xxs text-muted hover:text-accent hover:border-accent transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Ta'lim qo'shish
        </button>
      </div>
    </CollapsibleCard>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-muted/10 text-muted border-muted/20",
  A2: "bg-muted/10 text-muted border-muted/20",
  B1: "bg-accent/10 text-accent border-accent/20",
  B2: "bg-accent/10 text-accent border-accent/20",
  C1: "bg-success/10 text-success border-success/20",
  C2: "bg-success/10 text-success border-success/20",
};

export function SkillsForm({
  data,
  onChange,
}: {
  data: { technical: string[]; languages: Array<{ language: string; level: string }>; soft: string[] };
  onChange: (d: { technical: string[]; languages: Array<{ language: string; level: string }>; soft: string[] }) => void;
}) {
  const [techInput, setTechInput] = useState("");
  const [softInput, setSoftInput] = useState("");

  const addTech = () => {
    if (techInput.trim() && !data.technical.includes(techInput.trim())) {
      onChange({ ...data, technical: [...data.technical, techInput.trim()] });
      setTechInput("");
    }
  };

  const removeTech = (i: number) => {
    onChange({ ...data, technical: data.technical.filter((_, idx) => idx !== i) });
  };

  const addSoft = () => {
    if (softInput.trim() && !data.soft.includes(softInput.trim())) {
      onChange({ ...data, soft: [...data.soft, softInput.trim()] });
      setSoftInput("");
    }
  };

  const removeSoft = (i: number) => {
    onChange({ ...data, soft: data.soft.filter((_, idx) => idx !== i) });
  };

  const addLang = () => {
    onChange({
      ...data,
      languages: [...data.languages, { language: "", level: "A1" }],
    });
  };

  const updateLang = (i: number, key: string, value: string) => {
    const updated = data.languages.map((lang, idx) =>
      idx === i ? { ...lang, [key]: value } : lang
    );
    onChange({ ...data, languages: updated });
  };

  const removeLang = (i: number) => {
    onChange({ ...data, languages: data.languages.filter((_, idx) => idx !== i) });
  };

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  return (
    <CollapsibleCard sectionType="skills" data={data as unknown as Record<string, unknown>}>
      <div className="space-y-4">
        <div>
          <label className="block text-xxs font-medium text-muted mb-1.5 flex items-center gap-1.5">
            <Code2 className="h-3 w-3 text-accent" />
            Texnik ko'nikmalar
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.technical.map((t, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 rounded-badge bg-accent/10 border border-accent/20 px-2 py-0.5 text-xxs text-accent"
              >
                {t}
                <button type="button" onClick={() => removeTech(i)} className="hover:text-red-400">&times;</button>
              </motion.span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
              placeholder="Python, FastAPI, Docker..."
              className="flex-1 rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
            />
            <button type="button" onClick={addTech} className="rounded-input bg-accent px-3 text-xs text-white hover:bg-accent-glow transition-colors shrink-0">
              Qo'shish
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xxs font-medium text-muted mb-1.5 flex items-center gap-1.5">
            <Globe className="h-3 w-3 text-[#06B6D4]" />
            Til darajalari
          </label>
          <div className="space-y-2">
            {data.languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={lang.language}
                  onChange={(e) => updateLang(i, "language", e.target.value)}
                  placeholder="Ingliz tili"
                  className="flex-1 rounded-input bg-primary border border-border px-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
                />
                <select
                  value={lang.level}
                  onChange={(e) => updateLang(i, "level", e.target.value)}
                  className="rounded-input bg-primary border border-border px-2 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-accent"
                >
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <span className={`rounded-badge px-1.5 py-0.5 text-xxs border ${LEVEL_COLORS[lang.level] || LEVEL_COLORS.A1}`}>
                  {lang.level}
                </span>
                <button type="button" onClick={() => removeLang(i)} className="text-muted hover:text-red-400 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addLang} className="text-xxs text-accent hover:text-accent-glow transition-colors">
              + Til qo'shish
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xxs font-medium text-muted mb-1.5">Soft skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.soft.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 rounded-badge bg-surface border border-border px-2 py-0.5 text-xxs text-muted"
              >
                {s}
                <button type="button" onClick={() => removeSoft(i)} className="hover:text-red-400">&times;</button>
              </motion.span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={softInput}
              onChange={(e) => setSoftInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSoft(); } }}
              placeholder="Communication, Leadership..."
              className="flex-1 rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
            />
            <button type="button" onClick={addSoft} className="rounded-input bg-accent px-3 text-xs text-white hover:bg-accent-glow transition-colors shrink-0">
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}

export function ProjectsForm({
  data,
  onChange,
}: {
  data: { items: Array<Record<string, unknown>> };
  onChange: (d: { items: Array<Record<string, unknown>> }) => void;
}) {
  const items = data.items || [];

  const addItem = () => {
    onChange({ items: [...items, { name: "", description: "", technologies: [], github_url: "", live_url: "" }] });
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    onChange({ items: items.map((item, i) => (i === index ? { ...item, [key]: value } : item)) });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <CollapsibleCard sectionType="projects" data={data as unknown as Record<string, unknown>}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <ItemCard key={i} sectionType="projects" index={i} onRemove={() => removeItem(i)}>
            <Field label="Loyiha nomi" placeholder="E-commerce API" value={String(item.name || "")} onChange={(v) => updateItem(i, "name", v)} />
            <Field label="Tavsif" placeholder="..." value={String(item.description || "")} onChange={(v) => updateItem(i, "description", v)} multiline maxLength={1000} />
            <Field label="Texnologiyalar" placeholder="FastAPI, PostgreSQL, Redis" value={String(item.technologies || "")} onChange={(v) => updateItem(i, "technologies", v)} />
            <Field label="GitHub URL" placeholder="https://github.com/..." value={String(item.github_url || "")} onChange={(v) => updateItem(i, "github_url", v)} />
            <Field label="Live URL" placeholder="https://..." value={String(item.live_url || "")} onChange={(v) => updateItem(i, "live_url", v)} />
          </ItemCard>
        ))}
        <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-input border border-dashed border-border py-2 text-xxs text-muted hover:text-accent hover:border-accent transition-all">
          <Plus className="h-3.5 w-3.5" /> Loyiha qo'shish
        </button>
      </div>
    </CollapsibleCard>
  );
}

export function CertificationsForm({
  data,
  onChange,
}: {
  data: { items: Array<Record<string, unknown>> };
  onChange: (d: { items: Array<Record<string, unknown>> }) => void;
}) {
  const items = data.items || [];

  const addItem = () => {
    onChange({ items: [...items, { name: "", issuer: "", date: "" }] });
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    onChange({ items: items.map((item, i) => (i === index ? { ...item, [key]: value } : item)) });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <CollapsibleCard sectionType="certifications" data={data as unknown as Record<string, unknown>}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <ItemCard key={i} sectionType="certifications" index={i} onRemove={() => removeItem(i)}>
            <Field label="Sertifikat nomi" placeholder="AWS Solutions Architect" value={String(item.name || "")} onChange={(v) => updateItem(i, "name", v)} />
            <Field label="Beruvchi tashkilot" placeholder="Amazon" value={String(item.issuer || "")} onChange={(v) => updateItem(i, "issuer", v)} />
            <Field label="Sana" placeholder="2024-03" value={String(item.date || "")} onChange={(v) => updateItem(i, "date", v)} />
          </ItemCard>
        ))}
        <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-input border border-dashed border-border py-2 text-xxs text-muted hover:text-accent hover:border-accent transition-all">
          <Plus className="h-3.5 w-3.5" /> Sertifikat qo'shish
        </button>
      </div>
    </CollapsibleCard>
  );
}

export function LanguagesForm({
  data,
  onChange,
}: {
  data: { items: Array<{ language: string; level: string }> };
  onChange: (d: { items: Array<{ language: string; level: string }> }) => void;
}) {
  const items = data.items || [];
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const addItem = () => {
    onChange({ items: [...items, { language: "", level: "A1" }] });
  };

  const updateItem = (index: number, key: string, value: string) => {
    onChange({ items: items.map((item, i) => (i === index ? { ...item, [key]: value } : item)) });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <CollapsibleCard sectionType="languages" data={data as unknown as Record<string, unknown>}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item.language}
              onChange={(e) => updateItem(i, "language", e.target.value)}
              placeholder="Ingliz tili"
              className="flex-1 rounded-input bg-primary border border-border px-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
            />
            <select
              value={item.level}
              onChange={(e) => updateItem(i, "level", e.target.value)}
              className="rounded-input bg-primary border border-border px-2 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-accent"
            >
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <span className={`rounded-badge px-1.5 py-0.5 text-xxs border ${LEVEL_COLORS[item.level] || LEVEL_COLORS.A1}`}>
              {item.level}
            </span>
            <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-red-400 shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="text-xxs text-accent hover:text-accent-glow transition-colors">
          + Til qo'shish
        </button>
      </div>
    </CollapsibleCard>
  );
}
