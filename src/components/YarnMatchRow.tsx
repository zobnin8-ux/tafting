"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { formatYarnMatchLabel } from "@/services/YarnMatchService";
import type { YarnColorMatch } from "@/types";

interface YarnMatchRowProps {
  match: YarnColorMatch;
}

export function YarnMatchRow({ match }: YarnMatchRowProps) {
  const { t } = useTranslation();
  const catalogLabel =
    match.catalogId === "dmc"
      ? t("yarn.catalogDmc")
      : t("yarn.catalogTuftTheWorld");

  return (
    <div className="flex items-center gap-2 text-xs text-stone-600">
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-sm border border-stone-300"
        style={{ backgroundColor: match.hex }}
        title={match.hex}
      />
      <span className="min-w-0">
        <span className="font-medium text-stone-700">{catalogLabel}:</span>{" "}
        {formatYarnMatchLabel(match)}
        {match.catalogId === "dmc" && match.name !== match.colorId && (
          <span className="text-stone-400"> — {match.name}</span>
        )}
        {match.approximate && (
          <span className="text-stone-400"> ({t("yarn.approximate")})</span>
        )}
      </span>
    </div>
  );
}
