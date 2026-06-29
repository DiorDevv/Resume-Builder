"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

function FloatingShapes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const shapes: { x: number; y: number; size: number; rotation: number; speed: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 15; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 60 + 20,
        rotation: Math.random() * 360,
        speed: Math.random() * 0.3 + 0.1,
        alpha: Math.random() * 0.08 + 0.02,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of shapes) {
        s.y -= s.speed;
        s.rotation += s.speed * 0.5;
        if (s.y + s.size < 0) { s.y = canvas.height + s.size; s.x = Math.random() * canvas.width; }

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((s.rotation * Math.PI) / 180);
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = "#6366F1";
        ctx.lineWidth = 1;
        ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
        ctx.restore();
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
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FloatingLabel({ htmlFor, children, error }: { htmlFor: string; children: React.ReactNode; error?: boolean }) {
  return (
    <motion.label
      htmlFor={htmlFor}
      className={`block text-xs font-medium mb-1.5 transition-colors duration-300 ${error ? "text-red-400" : "text-muted"}`}
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {children}
    </motion.label>
  );
}

function AnimatedInput({ id, type, value, onChange, placeholder, required, minLength, error }: {
  id: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; required?: boolean; minLength?: number; error?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative"
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full rounded-input bg-primary border px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-muted/50
          focus:outline-none focus:ring-1 transition-all duration-300
          ${error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
            : focused
              ? "border-accent ring-1 ring-accent/30"
              : "border-border hover:border-border/80"
          }`}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-accent to-purple-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%", transformOrigin: "left" }}
      />
    </motion.div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = useLocale();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      router.push(`/${locale}/dashboard/builder`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-primary flex items-center justify-center px-6 overflow-hidden">
      <FloatingShapes />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
      />

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <TiltCard className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          className="w-full"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Link href={`/${locale}`} className="inline-flex items-center gap-2 group">
                <motion.div
                  whileHover={{ rotate: -10, scale: 1.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500"
                >
                  <span className="text-sm font-bold text-white">R</span>
                </motion.div>
                <span className="text-base font-bold tracking-tight text-[#F8FAFC]">
                  Resume<span className="text-accent">Builder</span>
                </span>
              </Link>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg font-bold"
            >
              {t("welcome")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-2 text-xs text-muted"
            >
              {t("loginSub")}
            </motion.p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="glass rounded-2xl p-6 space-y-5 border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-input bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 flex items-center gap-2"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </motion.div>
            )}

            <div>
              <FloatingLabel htmlFor="email">{t("email")}</FloatingLabel>
              <AnimatedInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
            </div>

            <div>
              <FloatingLabel htmlFor="password">{t("password")}</FloatingLabel>
              <AnimatedInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <motion.div
                    animate={rememberMe ? { borderColor: "#6366F1", backgroundColor: "rgba(99,102,241,0.2)" } : {}}
                    className="h-4 w-4 rounded border border-border bg-primary flex items-center justify-center group-hover:border-accent/50 transition-colors"
                  >
                    {rememberMe && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-3 w-3 text-accent"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </motion.svg>
                    )}
                  </motion.div>
                </div>
                <span className="text-xxs text-muted group-hover:text-[#F8FAFC] transition-colors">{t("rememberMe")}</span>
              </label>
              <span className="text-xxs text-muted/50 cursor-not-allowed">{t("forgotPassword")}</span>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="relative w-full rounded-input bg-gradient-to-r from-accent to-purple-600 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    {t("loginBtn")}
                    <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-xxs text-muted"
            >
              {t("noAccount")}{" "}
              <Link href={`/${locale}/register`} className="text-accent hover:text-accent-glow transition-colors relative group inline-flex items-center gap-1">
                {t("registerBtn")}
                <span className="absolute -bottom-px left-0 right-0 h-px bg-accent/50 scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
            </motion.p>
          </motion.form>
        </motion.div>
      </TiltCard>
    </main>
  );
}
