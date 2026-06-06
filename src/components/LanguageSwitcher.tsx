"use client";

import { useLocaleStore } from "@/store/useLocaleStore";
import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { Locale } from "@/i18n";

const LOCALES: Locale[] = ["en", "ru"];

export function LanguageSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useTranslation();

  const handleLocaleChange = (loc: Locale) => {
    setLocale(loc);
    const { images, recalculate } = useTuftingStore.getState();
    if (images) recalculate();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500">{t("lang.label")}</span>
      <div className="flex rounded-lg bg-stone-100 p-0.5">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              locale === loc
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t(`lang.${loc}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
