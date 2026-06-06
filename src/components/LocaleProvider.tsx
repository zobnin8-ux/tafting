"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/store/useLocaleStore";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
