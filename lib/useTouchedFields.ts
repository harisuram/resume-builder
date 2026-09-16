"use client";

import { useCallback, useState } from "react";

/** Blur-driven "has the user left this field" flags, keyed by a string so
 * list sections can use `"${index}.company"` without a typed union per form. */
export function useTouchedFields() {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = useCallback((field: string) => {
    return () => setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  }, []);

  const errorFor = useCallback(
    (field: string, message?: string) => (touched[field] ? message : undefined),
    [touched],
  );

  return { touch, errorFor };
}
