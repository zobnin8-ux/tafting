"use client";

import { useCallback } from "react";
import { translate, getSkeinLabel, getUnitLabel, type Locale } from "@/i18n";
import { useLocaleStore } from "@/store/useLocaleStore";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const skeinLabel = useCallback(
    (count: number, section: "palette" | "materials" | "pdf" = "palette") =>
      getSkeinLabel(locale, count, section),
    [locale]
  );

  const unitLabel = useCallback(
    (unit: "inches" | "centimeters") => getUnitLabel(locale, unit),
    [locale]
  );

  return { t, locale, skeinLabel, unitLabel };
}

export type { Locale };
