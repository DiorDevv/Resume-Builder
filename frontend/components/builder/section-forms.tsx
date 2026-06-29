"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";

interface CollapsibleCardProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  dragHandle?: boolean;
  onDelete?: () => void;
}

export function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
  dragHandle,
  onDelete,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          {dragHandle && (
            <GripVertical className="h-4 w-4 text-muted cursor-grab" />
          )}
          <span className="text-xs font-semibold text-[#F8FAFC]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
            <div className="px-4 pb-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
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
}

export function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline,
  type = "text",
  disabled,
}: FieldProps) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="block text-xxs font-medium text-muted mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="w-full rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none disabled:opacity-50"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-50"
        />
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
    <CollapsibleCard title="Shaxsiy ma'lumotlar">
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
          />
        </div>
      </div>
    </CollapsibleCard>
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
    <CollapsibleCard title="Ish tajribasi">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-input bg-primary/50 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
            />
          </div>
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
    <CollapsibleCard title="Ta'lim">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-input bg-primary/50 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
          </div>
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
    <CollapsibleCard title="Ko'nikmalar">
      <div className="space-y-4">
        <div>
          <label className="block text-xxs font-medium text-muted mb-1">Texnik ko'nikmalar</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.technical.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-badge bg-accent/10 px-2 py-0.5 text-xxs text-accent">
                {t}
                <button type="button" onClick={() => removeTech(i)} className="hover:text-red-400">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
              placeholder="Python, FastAPI, Docker..."
              className="flex-1 rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent"
            />
            <button type="button" onClick={addTech} className="rounded-input bg-accent px-3 text-xs text-white hover:bg-accent-glow transition-colors">
              Qo'shish
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xxs font-medium text-muted mb-1">Til darajalari</label>
          <div className="space-y-2">
            {data.languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={lang.language}
                  onChange={(e) => updateLang(i, "language", e.target.value)}
                  placeholder="Ingliz tili"
                  className="flex-1 rounded-input bg-primary border border-border px-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent"
                />
                <select
                  value={lang.level}
                  onChange={(e) => updateLang(i, "level", e.target.value)}
                  className="rounded-input bg-primary border border-border px-2 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-accent"
                >
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <button type="button" onClick={() => removeLang(i)} className="text-muted hover:text-red-400">
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
          <label className="block text-xxs font-medium text-muted mb-1">Soft skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.soft.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-badge bg-surface border border-border px-2 py-0.5 text-xxs text-muted">
                {s}
                <button type="button" onClick={() => removeSoft(i)} className="hover:text-red-400">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={softInput}
              onChange={(e) => setSoftInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSoft(); } }}
              placeholder="Communication, Leadership..."
              className="flex-1 rounded-input bg-primary border border-border px-3 py-2 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent"
            />
            <button type="button" onClick={addSoft} className="rounded-input bg-accent px-3 text-xs text-white hover:bg-accent-glow transition-colors">
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}

const defaultProjects = { items: [] as Array<Record<string, unknown>> };

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
    <CollapsibleCard title="Loyihalar">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-input bg-primary/50 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Field label="Loyiha nomi" placeholder="E-commerce API" value={String(item.name || "")} onChange={(v) => updateItem(i, "name", v)} />
            <Field label="Tavsif" placeholder="..." value={String(item.description || "")} onChange={(v) => updateItem(i, "description", v)} multiline />
            <Field label="Texnologiyalar" placeholder="FastAPI, PostgreSQL, Redis" value={String(item.technologies || "")} onChange={(v) => updateItem(i, "technologies", v)} />
            <Field label="GitHub URL" placeholder="https://github.com/..." value={String(item.github_url || "")} onChange={(v) => updateItem(i, "github_url", v)} />
            <Field label="Live URL" placeholder="https://..." value={String(item.live_url || "")} onChange={(v) => updateItem(i, "live_url", v)} />
          </div>
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
    <CollapsibleCard title="Sertifikatlar">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-input bg-primary/50 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-medium text-muted">#{i + 1}</span>
              <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Field label="Sertifikat nomi" placeholder="AWS Solutions Architect" value={String(item.name || "")} onChange={(v) => updateItem(i, "name", v)} />
            <Field label="Beruvchi tashkilot" placeholder="Amazon" value={String(item.issuer || "")} onChange={(v) => updateItem(i, "issuer", v)} />
            <Field label="Sana" placeholder="2024-03" value={String(item.date || "")} onChange={(v) => updateItem(i, "date", v)} />
          </div>
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
    <CollapsibleCard title="Tillar">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item.language}
              onChange={(e) => updateItem(i, "language", e.target.value)}
              placeholder="Ingliz tili"
              className="flex-1 rounded-input bg-primary border border-border px-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-muted/50 focus:outline-none focus:border-accent"
            />
            <select
              value={item.level}
              onChange={(e) => updateItem(i, "level", e.target.value)}
              className="rounded-input bg-primary border border-border px-2 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-accent"
            >
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-red-400">
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
