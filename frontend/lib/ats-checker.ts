interface ResumeCheckData {
  personal_info?: Record<string, unknown>;
  personalInfo?: Record<string, unknown>;
  work_experience?: { items?: Array<Record<string, unknown>> };
  workExperience?: { items?: Array<Record<string, unknown>> };
  education?: { items?: Array<Record<string, unknown>> };
  skills?: {
    technical?: string[];
    languages?: Array<{ language?: string; level?: string }>;
    soft?: string[];
  };
  projects?: { items?: Array<Record<string, unknown>> };
  certifications?: { items?: Array<Record<string, unknown>> };
  languages?: { items?: Array<{ language?: string; level?: string }> };
  [key: string]: unknown;
}

const OZBEK_IT_KEYWORDS = [
  "python", "javascript", "typescript", "java", "go", "rust", "c++", "c#",
  "react", "next.js", "vue", "angular", "node.js", "express", "django",
  "fastapi", "flask", "spring", "laravel", "dotnet",
  "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "docker", "kubernetes", "nginx", "kafka", "rabbitmq",
  "aws", "gcp", "azure", "git", "linux", "bash",
  "sql", "rest api", "graphql", "grpc", "websocket",
  "pytest", "jest", "ci/cd", "github actions", "gitlab ci",
  "microservices", "solid", "tdd", "agile", "scrum",
  "telegram bot", "bot", "api", "backend", "frontend", "fullstack",
];

export interface ATSIssue {
  type: "error" | "warning" | "success";
  message: string;
}

export interface ATSResult {
  score: number;
  issues: ATSIssue[];
}

export function calculateATSScore(data: ResumeCheckData): ATSResult {
  let score = 50;
  const issues: ATSIssue[] = [];

  const info = (data.personal_info || data.personalInfo || {}) as Record<string, unknown>;

  if (!info?.full_name) {
    score -= 10;
    issues.push({ type: "error", message: "Ism va familiya majburiy" });
  } else {
    issues.push({ type: "success", message: "Ism va familiya mavjud" });
  }

  const email = String(info.email || "");
  if (!email) {
    score -= 10;
    issues.push({ type: "error", message: "Email majburiy" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    score -= 5;
    issues.push({ type: "error", message: "Email formati noto'g'ri" });
  } else {
    issues.push({ type: "success", message: "Email formati to'g'ri" });
  }

  const phone = String(info.phone || "");
  if (!phone) {
    score -= 5;
    issues.push({ type: "error", message: "Telefon raqam majburiy" });
  } else if (!/^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ""))) {
    score -= 3;
    issues.push({ type: "warning", message: "Telefon formati noto'g'ri (masalan: +998901234567)" });
  } else {
    issues.push({ type: "success", message: "Telefon raqam mavjud" });
  }

  if (!info?.city) {
    score -= 3;
    issues.push({ type: "warning", message: "Shahar ko'rsatilmagan" });
  } else {
    issues.push({ type: "success", message: "Shahar ko'rsatilgan" });
  }

  if (!info?.summary) {
    score -= 5;
    issues.push({ type: "warning", message: "Professional summary yo'q — ATS reytingni pasaytiradi" });
  } else {
    issues.push({ type: "success", message: "Professional summary mavjud" });
  }

  if (info?.linkedin) {
    score += 3;
    issues.push({ type: "success", message: "LinkedIn profil qo'shilgan (+3 ball)" });
  } else {
    issues.push({ type: "warning", message: "LinkedIn profil tavsiya qilinadi" });
  }
  if (info?.github) {
    score += 3;
    issues.push({ type: "success", message: "GitHub profil qo'shilgan (+3 ball)" });
  }

  const work = (data.work_experience || data.workExperience || {}) as { items?: Array<Record<string, unknown>> };
  const workItems = work.items || [];
  if (workItems.length === 0) {
    score -= 15;
    issues.push({ type: "error", message: "Ish tajribasi majburiy — eng muhim section" });
  } else {
    score += Math.min(workItems.length * 5, 15);
    issues.push({ type: "success", message: `${workItems.length} ta ish tajribasi (+${Math.min(workItems.length * 5, 15)} ball)` });
    for (const exp of workItems) {
      if (exp.description) score += 2;
      if (Array.isArray(exp.bullet_points) && exp.bullet_points.length >= 3) score += 3;
    }
  }

  const edu = data.education as { items?: Array<Record<string, unknown>> };
  const eduItems = edu?.items || [];
  if (eduItems.length === 0) {
    score -= 10;
    issues.push({ type: "error", message: "Ta'lim ma'lumoti yo'q" });
  } else {
    score += 5;
    issues.push({ type: "success", message: "Ta'lim ma'lumoti mavjud (+5 ball)" });
  }

  const skills = data.skills;
  if (!skills || (!skills.technical?.length && !skills.soft?.length)) {
    score -= 10;
    issues.push({ type: "error", message: "Texnik ko'nikmalar yo'q — IT CV da majburiy" });
  } else {
    const allText = [
      ...(skills.technical || []),
      ...(skills.soft || []),
      ...(skills.languages || []).map((l) => l.language || ""),
    ].map((s) => s.toLowerCase());

    const matched = OZBEK_IT_KEYWORDS.filter((kw) =>
      allText.some((s) => s.includes(kw))
    );
    const unique = Array.from(new Set(matched));
    score += Math.min(unique.length * 2, 10);

    if (unique.length > 0) {
      issues.push({
        type: "success",
        message: `${unique.length} ta IT kalit so'z topildi (+${Math.min(unique.length * 2, 10)} ball)`,
      });
    } else {
      issues.push({
        type: "warning",
        message: "IT sohasiga oid kalit so'zlar topilmadi",
      });
    }

    if (skills.technical) {
      issues.push({
        type: "success",
        message: `${skills.technical.length} ta texnik ko'nikma`,
      });
    }
  }

  const hasDates = workItems.some(
    (e) => e.start_date && (e.end_date || e.is_current)
  );
  if (workItems.length > 0 && !hasDates) {
    score -= 5;
    issues.push({ type: "error", message: "Ish tajribasi sanalari to'liq emas" });
  } else if (workItems.length > 0) {
    issues.push({ type: "success", message: "Sana formatlari to'g'ri" });
  }

  const clean = JSON.stringify(data);
  if (/[<>{}\\]/.test(clean)) {
    score -= 5;
    issues.push({ type: "error", message: "Mos kelmaydigan belgilar topildi (< > { } \\)" });
  } else {
    issues.push({ type: "success", message: "Maxsus belgilar yo'q — ATS xavfsiz" });
  }

  if (/<table|<tr|<td|<th/i.test(clean)) {
    score -= 5;
    issues.push({ type: "error", message: "Jadval ishlatilgan — ATS tizimida noto'g'ri ko'rinishi mumkin" });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
  };
}

export function getATSBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "A'lo", color: "text-success" };
  if (score >= 60) return { label: "Yaxshi", color: "text-warning" };
  return { label: "Yaxshilash kerak", color: "text-red-400" };
}
