"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

interface Template {
  id: string;
  name: string;
  thumbnail_url: string | null;
  is_active: boolean;
}

const TEMPLATE_PREVIEWS: Record<string, { color: string; descKey: string }> = {
  classic: { color: "from-blue-500/20 to-indigo-500/20", descKey: "classicDesc" },
  modern: { color: "from-purple-500/20 to-pink-500/20", descKey: "modernDesc" },
  minimal: { color: "from-emerald-500/20 to-teal-500/20", descKey: "minimalDesc" },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("templates");

  useEffect(() => {
    apiFetch<{ templates: Template[] }>("/api/v1/templates")
      .then((data) => setTemplates(data.templates))
      .catch((err) => console.error("Templates yuklanmadi:", err))
      .finally(() => setLoading(false));
  }, []);

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
        {Object.entries(TEMPLATE_PREVIEWS).map(([name, info], i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="glass rounded-card overflow-hidden group cursor-pointer hover:border-accent/30 transition-all duration-300">
              <div className={`relative h-64 bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                <div className="w-32 h-44 rounded-lg bg-surface/90 border border-border/30 p-3 flex flex-col gap-1.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-accent/30" />
                  <div className="h-1 w-1/2 rounded-full bg-muted/30" />
                  <div className="mt-2 space-y-1">
                    <div className="h-1 rounded-full bg-muted/20" />
                    <div className="h-1 rounded-full bg-muted/20" />
                    <div className="h-1 w-2/3 rounded-full bg-muted/20" />
                  </div>
                  <div className="mt-1 space-y-1">
                    <div className="h-1 rounded-full bg-muted/20" />
                    <div className="h-1 w-1/2 rounded-full bg-muted/20" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-bold text-[#F8FAFC] capitalize">{name}</h3>
                <p className="mt-1 text-xxs text-muted">{t(info.descKey)}</p>
                <button
                  onClick={() => router.push(`/${locale}/builder`)}
                  className="mt-3 w-full rounded-input bg-accent px-4 py-1.5 text-xxs font-medium text-white hover:bg-accent-glow transition-all"
                >
                  {t("useTemplate")}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
