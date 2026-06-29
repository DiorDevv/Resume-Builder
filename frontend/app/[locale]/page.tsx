"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useEffect, useRef, useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        hue: 230 + Math.random() * 40,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 60%, ${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedGradientText({ text }: { text: string }) {
  return (
    <span className="bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
      {text}
    </span>
  );
}

const floating = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
};

const glowPulse = {
  initial: { opacity: 0.6, scale: 1 },
  animate: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function Home() {
  const locale = useLocale();
  const t = useTranslations("landing");
  const n = useTranslations("nav");

  const features = [
    { icon: "sparkles", title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: "shield", title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: "monitor", title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: "globe", title: t("feature4Title"), desc: t("feature4Desc") },
    { icon: "layout", title: t("feature5Title"), desc: t("feature5Desc") },
    { icon: "download", title: t("feature6Title"), desc: t("feature6Desc") },
  ];

  const templates = [
    { name: "Classic", desc: "An'anaviy va ishonchli", color: "from-blue-500/20 to-indigo-500/20" },
    { name: "Modern", desc: "Zamonaviy va premium", color: "from-purple-500/20 to-pink-500/20" },
    { name: "Minimal", desc: "Sodda va toza", color: "from-emerald-500/20 to-teal-500/20" },
  ];

  const SvgIcon = ({ name }: { name: string }) => {
    const icons: Record<string, JSX.Element> = {
      sparkles: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      shield: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      monitor: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      ),
      globe: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
      layout: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      download: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    };
    return icons[name] || null;
  };

  return (
    <main className="min-h-screen bg-primary overflow-hidden">
      <ParticleField />

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-primary/80 backdrop-blur-[12px]"
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-accent"
            >
              <span className="text-sm font-bold text-white">R</span>
            </motion.div>
            <span className="text-base font-bold tracking-tight text-[#F8FAFC]">
              Resume<span className="text-accent">Builder</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/login`}
              className="rounded-input px-4 py-2 text-xs text-muted hover:text-[#F8FAFC] transition-colors relative group"
            >
              {n("login")}
              <span className="absolute inset-x-0 bottom-0 h-px bg-accent/50 scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href={`/${locale}/register`}
                className="rounded-input bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-glow transition-colors glow"
              >
                {n("register")}
              </Link>
            </motion.div>
          </div>
        </nav>
      </motion.header>

      <section className="relative mx-auto max-w-7xl px-6 pt-36 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted">{t("badge")}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight"
        >
          {t("title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-sm text-muted leading-relaxed"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={`/${locale}/register`}
              className="rounded-input bg-accent px-8 py-3 text-sm font-medium text-white hover:bg-accent-glow transition-all duration-300 glow-accent inline-flex items-center gap-2 group"
            >
              {t("cta")}
              <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
          <Link
            href="#how-it-works"
            className="rounded-input border border-border px-8 py-3 text-sm font-medium text-muted hover:text-[#F8FAFC] hover:bg-surface transition-all duration-300"
          >
            {t("howItWorks")}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-16 mx-auto flex max-w-lg items-center justify-center gap-8 sm:gap-12"
        >
          {[
            { value: "3+", label: t("statsTemplates") },
            { value: "3", label: t("statsLanguages") },
            { value: "<3s", label: t("statsExport") },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="text-center relative"
            >
              <motion.div
                animate={glowPulse.animate}
                className="absolute inset-0 bg-accent/5 blur-xl rounded-full"
              />
              <div className="relative text-2xl font-bold text-[#F8FAFC]">{stat.value}</div>
              <div className="mt-1 text-xxs text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16 mx-auto max-w-5xl"
        >
          <TiltCard className="w-full perspective-[1000px]">
            <motion.div
              animate={floating.animate}
              className="relative glass rounded-2xl p-1 overflow-hidden border border-border/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
              <div className="relative rounded-xl bg-[#0A0A0F]/80 backdrop-blur-sm p-6 flex items-center justify-center h-64 sm:h-80">
                <div className="text-center">
                  <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center mb-4"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <span className="text-3xl font-bold text-white" style={{ transform: "translateZ(20px)" }}>CV</span>
                  </motion.div>
                  <p className="text-sm text-muted">3 ta template | 3 tilda | 3 soniyada PDF</p>
                </div>
              </div>
            </motion.div>
          </TiltCard>
        </motion.div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-xl font-bold sm:text-2xl">
            {t("featuresTitle")}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-muted">
            {t("featuresSub")}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, i) => (
            <motion.div key={feature.title} variants={fadeUp} custom={i}>
              <TiltCard>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-card p-6 h-full border border-border/50 hover:border-accent/30 transition-all duration-300 group"
                >
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors"
                  >
                    <SvgIcon name={feature.icon} />
                  </motion.div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">{feature.title}</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{feature.desc}</p>
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="templates" className="relative mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-xl font-bold sm:text-2xl">
            {t("templatesTitle")}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-muted">
            {t("templatesSub")}
          </motion.p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {templates.map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <TiltCard>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="glass rounded-card p-1 overflow-hidden border border-border/50 group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative rounded-xl bg-[#0A0A0F]/80 backdrop-blur-sm p-6 text-center">
                    <div className="mx-auto mb-4 h-32 w-24 rounded-lg bg-gradient-to-b from-accent/20 to-accent/5 border border-border/30 flex items-center justify-center">
                      <span className="text-xxs text-muted rotate-90 whitespace-nowrap">{template.name}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">{template.name}</h3>
                    <p className="mt-1 text-xs text-muted">{template.desc}</p>
                  </div>
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-xl font-bold sm:text-2xl">
            {t("stepsTitle")}
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-muted">
            {t("stepsSub")}
          </motion.p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: "01", title: t("step1Title"), desc: t("step1Desc") },
            { step: "02", title: t("step2Title"), desc: t("step2Desc") },
            { step: "03", title: t("step3Title"), desc: t("step3Desc") },
          ].map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: i === 1 ? 0 : i === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="glass rounded-card p-6 text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-purple-500"
                >
                  <span className="text-lg font-bold text-white">{step.step}</span>
                </motion.div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">{step.title}</h3>
                <p className="mt-2 text-xs text-muted">{step.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden sm:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-accent/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="glass rounded-card p-12 text-center glow relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
          <div className="relative">
            <motion.h2 variants={fadeUp} className="text-xl font-bold">{t("ctaTitle")}</motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-sm text-muted max-w-lg mx-auto">{t("ctaDesc")}</motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={`/${locale}/register`}
                  className="rounded-input bg-accent px-8 py-3 text-sm font-medium text-white hover:bg-accent-glow transition-all duration-300 glow-accent inline-flex items-center gap-2 group"
                >
                  {t("cta")}
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-xxs text-muted">&copy; 2026 Resume Builder. {t("footer")}</p>
        </div>
      </footer>
    </main>
  );
}
