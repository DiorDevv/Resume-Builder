"use client";

import { useMemo } from "react";
import { calculateATSScore, getATSBadge, type ATSIssue } from "@/lib/ats-checker";

interface ATSPanelProps {
  data: Record<string, unknown>;
}

export function ATSPanel({ data }: ATSPanelProps) {
  const result = useMemo(() => calculateATSScore(data), [data]);
  const badge = useMemo(() => getATSBadge(result.score), [result.score]);

  const errors = result.issues.filter((i) => i.type === "error");
  const warnings = result.issues.filter((i) => i.type === "warning");
  const successes = result.issues.filter((i) => i.type === "success");

  return (
    <div className="glass rounded-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xxs text-muted mb-0.5">ATS moslik ball</div>
          <div className={`text-xl font-bold ${badge.color}`}>{result.score}/100</div>
        </div>
        <div className={`rounded-badge px-3 py-1 text-xxs font-medium ${badge.color} bg-current/10`}>
          {badge.label}
        </div>
      </div>

      <div className="space-y-1.5">
        {result.score >= 80 && (
          <div className="text-xxs text-success">CV ingiz ATS tizimidan muvaffaqiyatli o'tadi</div>
        )}
        {result.score >= 60 && result.score < 80 && (
          <div className="text-xxs text-warning">CV ingizni yaxshilash tavsiya qilinadi</div>
        )}
        {result.score < 60 && (
          <div className="text-xxs text-red-400">CV ingizni yaxshilash kerak — quyidagi muammolarni hal qiling</div>
        )}

        <hr className="border-border" />

        {errors.length > 0 && (
          <div>
            <div className="text-xxs text-red-400 font-medium mb-1">Muammolar ({errors.length})</div>
            {errors.map((issue, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xxs text-red-400/80">
                <span className="mt-0.5 shrink-0">&#x2716;</span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <div className="text-xxs text-warning font-medium mb-1">Tavsiyalar ({warnings.length})</div>
            {warnings.map((issue, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xxs text-warning/80">
                <span className="mt-0.5 shrink-0">&#x26A0;</span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {successes.length > 0 && (
          <div>
            <div className="text-xxs text-success font-medium mb-1">Yaxshi ({successes.length})</div>
            {successes.slice(0, 5).map((issue, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xxs text-success/80">
                <span className="mt-0.5 shrink-0">&#x2714;</span>
                <span>{issue.message}</span>
              </div>
            ))}
            {successes.length > 5 && (
              <div className="text-xxs text-muted mt-0.5">+ {successes.length - 5} ta</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
