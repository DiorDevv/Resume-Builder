"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useAutoSave(resumeId: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dirtyRef = useRef(false);
  const dataRef = useRef<Record<string, unknown> | null>(null);

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
        dataRef.current = null;
      } catch (err) {
        console.warn("Auto-save failed:", err);
      } finally {
        setSaving(false);
      }
    },
    [resumeId]
  );

  const debouncedSave = useCallback(
    (data: Record<string, unknown>) => {
      dirtyRef.current = true;
      dataRef.current = data;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (dataRef.current) save(dataRef.current);
      }, 2000);
    },
    [save]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current && dataRef.current) {
        save(dataRef.current);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [save]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dirtyRef.current && dataRef.current) {
        save(dataRef.current);
      }
    };
  }, [save]);

  return { debouncedSave, saving, lastSaved };
}
