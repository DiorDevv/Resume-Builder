'use client';

import { ATSPanel } from "./ats-panel";

interface PreviewProps {
  data: Record<string, unknown>;
}

export function ResumePreview({ data }: PreviewProps) {
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
      <div className="mb-4">
        <ATSPanel data={data as Record<string, unknown>} />
      </div>

      <div className="flex-1 glass rounded-card p-6 overflow-y-auto">
        {!hasContent ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-muted">CV ingiz bo'sh</div>
              <div className="text-xxs text-muted/50 mt-1">
                Chapdagi formalarni to'ldiring
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
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
                  <p className="mt-2 text-xxs text-muted leading-relaxed">
                    {s(info.summary)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {work.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2">
                  Ish tajribasi
                </h3>
                <div className="space-y-3">
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
                        <div className="text-xxs text-muted text-right whitespace-nowrap">
                          {s(item.start_date)}{" "}
                          {item.is_current
                            ? "— Hozir"
                            : item.end_date
                              ? `— ${s(item.end_date)}`
                              : ""}
                        </div>
                      </div>
                      {item.description ? (
                        <p className="mt-1 text-xxs text-muted leading-relaxed">
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
                <h3 className="text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2">
                  Ta&apos;lim
                </h3>
                <div className="space-y-2">
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
                <h3 className="text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2">
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
                <h3 className="text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2">
                  Loyihalar
                </h3>
                <div className="space-y-2">
                  {projects.map((item, i) => (
                    <div key={i}>
                      <div className="text-xxs font-medium text-[#F8FAFC]">
                        {s(item.name)}
                      </div>
                      {item.description ? (
                        <p className="text-xxs text-muted">{s(item.description)}</p>
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
                <h3 className="text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2">
                  Sertifikatlar
                </h3>
                <div className="space-y-1">
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
                <h3 className="text-xs font-semibold text-[#F8FAFC] border-b border-border pb-1 mb-2">
                  Tillar
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xxs text-muted">
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
  );
}
