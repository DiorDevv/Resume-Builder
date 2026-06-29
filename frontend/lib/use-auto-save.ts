"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useAutoSave(resumeId: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dirtyRef = useRef(false);

  const save = useCallback(
    async (data: Record<string, unknown>) => {
      if (!resumeId) return;
      setSaving(true);
      try {
        await apiFetch(`/api/v1/resumes/${resumeId}/auto-save`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        setLastSaved(new Date());
        dirtyRef.current = false;
      } catch {
        // silent fail
      } finally {
        setSaving(false);
      }
    },
    [resumeId]
  );

  const debouncedSave = useCallback(
    (data: Record<string, unknown>) => {
      dirtyRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => save(data), 2000);
    },
    [save]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        // auto-save every 30s even if no changes
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { debouncedSave, saving, lastSaved };
}
