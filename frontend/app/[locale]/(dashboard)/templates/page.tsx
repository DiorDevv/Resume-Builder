"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Eye, ArrowRight, Check, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface Template {
  id: string;
  name: string;
  thumbnail_url: string | null;
  is_active: boolean;
}

type TemplateKey = "classic" | "modern" | "minimal";

const TEMPLATE_META: Record<TemplateKey, {
  color: string;
  gradient: string;
  features: string[];
  preview: React.FC;
}> = {
  classic: {
    color: "from-blue-500/20 to-indigo-500/20",
    gradient: "from-blue-500/10 to-indigo-500/5",
    features: [
      "Ikki ustunli sidebar layout",
      "Tajriba va ta'limga urg'u",
      "ATS optimallashtirilgan",
      "Standart A4 format",
    ],
    preview: ClassicPreview,
  },
  modern: {
    color: "from-purple-500/20 to-pink-500/20",
    gradient: "from-purple-500/10 to-pink-500/5",
    features: [
      "Bir ustunli zamonaviy dizayn",
      "Indigo aksent ranglar",
      "Section hover effektlari",
      "Mobile responsive",
    ],
    preview: ModernPreview,
  },
  minimal: {
    color: "from-emerald-500/20 to-teal-500/20",
    gradient: "from-emerald-500/10 to-teal-500/5",
    features: [
      "Minimal va toza dizayn",
      "Matnga asosiy e'tibor",
      "Maksimal ATS natija",
      "Tez yuklanuvchi PDF",
    ],
    preview: MinimalPreview,
  },
};

function ClassicPreview() {
  return (
    <div className="flex h-full gap-2">
      <div className="w-1/3 space-y-2">
        <div className="h-1.5 w-3/4 rounded-full bg-accent/40" />
        <div className="h-1 w-full rounded-full bg-muted/20" />
        <div className="h-1 w-2/3 rounded-full bg-muted/20" />
        <div className="mt-3 space-y-1">
          <div className="h-1 rounded-full bg-accent/30 w-2/3" />
          <div className="h-1 rounded-full bg-muted/20" />
          <div className="h-1 rounded-full bg-muted/20 w-1/2" />
        </div>
      </div>
      <div className="w-2/3 space-y-2">
        <div className="h-1.5 w-1/2 rounded-full bg-[#F8FAFC]/40" />
        <div className="space-y-1">
          <div className="h-1 rounded-full bg-accent/30 w-1/3" />
          <div className="h-1 rounded-full bg-muted/20" />
          <div className="h-1 rounded-full bg-muted/20 w-3/4" />
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1 rounded-full bg-accent/30 w-1/3" />
          <div className="h-1 rounded-full bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

function ModernPreview() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-accent" />
        <div className="h-1.5 w-1/2 rounded-full bg-[#F8FAFC]/40" />
      </div>
      <div className="space-y-1 pl-5">
        <div className="h-1 rounded-full bg-accent/30 w-1/3" />
        <div className="h-1 rounded-full bg-muted/20" />
        <div className="h-1 rounded-full bg-muted/20 w-2/3" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-3 w-3 rounded-full bg-accent" />
        <div className="h-1.5 w-1/3 rounded-full bg-[#F8FAFC]/40" />
      </div>
      <div className="space-y-1 pl-5">
        <div className="h-1 rounded-full bg-accent/30 w-1/2" />
        <div className="h-1 rounded-full bg-muted/20" />
      </div>
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="space-y-2.5">
      <div className="h-1.5 w-2/5 rounded-full bg-[#F8FAFC]/30" />
      <div className="space-y-1">
        <div className="h-0.5 rounded-full bg-muted/20 w-1/4" />
        <div className="h-0.5 rounded-full bg-muted/10" />
      </div>
      <div className="pt-2 space-y-1">
        <div className="h-0.5 rounded-full bg-muted/15 w-1/3" />
        <div className="h-0.5 rounded-full bg-muted/10 w-3/4" />
        <div className="h-0.5 rounded-full bg-muted/10 w-1/2" />
      </div>
      <div className="space-y-1">
        <div className="h-0.5 rounded-full bg-muted/15 w-1/3" />
        <div className="h-0.5 rounded-full bg-muted/10 w-2/3" />
      </div>
    </div>
  );
}

function TemplateCard({
  name,
  meta,
  index,
  onSelect,
}: {
  name: TemplateKey;
  meta: typeof TEMPLATE_META[TemplateKey];
  index: number;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX(((y - rect.height / 2) / rect.height) * -15);
    setRotateY(((x - rect.width / 2) / rect.width) * 15);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        className="perspective-[1000px] cursor-pointer"
      >
        <motion.div
          animate={{
            rotateX,
            rotateY,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="glass rounded-card overflow-hidden group hover:border-accent/40 transition-colors duration-300"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={`relative h-56 bg-gradient-to-br ${meta.gradient} flex items-center justify-center overflow-hidden`}
          >
            <div className="w-40 h-52 rounded-lg bg-surface/90 border border-border/30 p-3 shadow-lg">
              <meta.preview />
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-surface/40 backdrop-blur-[2px] flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2 rounded-input bg-accent px-4 py-2 text-xxs font-medium text-white shadow-lg"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Batafsil ko'rish
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#F8FAFC] capitalize flex items-center gap-1.5">
                {name}
                {index === 0 && (
                  <span className="rounded-badge bg-accent/10 text-accent text-xxs px-1.5 py-0.5 flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Top
                  </span>
                )}
              </h3>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {meta.features.slice(0, 2).map((f, i) => (
                <span key={i} className="rounded-badge bg-surface border border-border/50 px-1.5 py-0.5 text-xxs text-muted">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DetailModal({
  name,
  meta,
  onClose,
  onUse,
}: {
  name: TemplateKey;
  meta: typeof TEMPLATE_META[TemplateKey];
  onClose: () => void;
  onUse: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl glass rounded-card overflow-hidden border border-border/50"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
              <FileText className="h-4 w-4 text-[#F8FAFC]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC] capitalize">{name}</h2>
              <p className="text-xxs text-muted">Template tafsilotlari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-input p-1.5 text-muted hover:text-[#F8FAFC] hover:bg-surface transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-3/5 p-6">
            <div
              className={`relative h-72 rounded-card bg-gradient-to-br ${meta.gradient} flex items-center justify-center overflow-hidden border border-border/30`}
            >
              <div className="w-48 h-64 rounded-lg bg-surface/95 border border-border/30 p-4 shadow-xl">
                <meta.preview />
              </div>
            </div>
          </div>
          <div className="lg:w-2/5 p-6 border-t lg:border-t-0 lg:border-l border-border/50">
            <h3 className="text-xs font-semibold text-[#F8FAFC] mb-3">Xususiyatlar</h3>
            <ul className="space-y-2">
              {meta.features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 text-xxs text-muted"
                >
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  {f}
                </motion.li>
              ))}
            </ul>
            <button
              onClick={onUse}
              className="mt-6 w-full rounded-input bg-accent px-4 py-2.5 text-xs font-medium text-white hover:bg-accent-glow transition-all flex items-center justify-center gap-2"
            >
              Bu templateni ishlatish
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TemplateKey | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("templates");

  useEffect(() => {
    apiFetch<{ templates: Template[] }>("/api/v1/templates")
      .then((data) => setTemplates(data.templates))
      .catch((err) => console.error("Templates yuklanmadi:", err))
      .finally(() => setLoading(false));
  }, []);

  const templatesNames = Object.keys(TEMPLATE_META) as TemplateKey[];

  const handleUse = (name: TemplateKey) => {
    router.push(`/${locale}/builder?template=${name}`);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-sm font-bold text-[#F8FAFC]">{t("title")}</h1>
        <p className="mt-1 text-xs text-muted">{t("subtitle")}</p>
      </motion.div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templatesNames.map((name, i) => (
          <TemplateCard
            key={name}
            name={name}
            meta={TEMPLATE_META[name]}
            index={i}
            onSelect={() => setSelected(name)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <DetailModal
            name={selected}
            meta={TEMPLATE_META[selected]}
            onClose={() => setSelected(null)}
            onUse={() => handleUse(selected)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
