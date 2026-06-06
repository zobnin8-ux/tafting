"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { PrepWarning } from "@/types";

const severityStyles: Record<PrepWarning["severity"], string> = {
  info: "border-stone-200 bg-stone-50 text-stone-600",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

export function PrepWarnings() {
  const prepWarnings = useTuftingStore((s) => s.prepWarnings);
  const images = useTuftingStore((s) => s.images);
  const { t } = useTranslation();

  if (!images || prepWarnings.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {t("prep.warningsTitle")}
      </h4>
      <div className="max-h-36 space-y-1.5 overflow-y-auto">
        {prepWarnings.map((warning) => (
          <div
            key={warning.key}
            className={`rounded-md border px-2.5 py-2 text-xs ${severityStyles[warning.severity]}`}
          >
            {t(`prep.warning.${warning.key}`)}
          </div>
        ))}
      </div>
    </div>
  );
}
