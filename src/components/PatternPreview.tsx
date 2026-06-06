"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import { PreviewCanvas } from "./PreviewCanvas";
import type { PreviewMode } from "@/types";
import type { ComplexityRating } from "@/types";

export function PatternPreview() {
  const images = useTuftingStore((s) => s.images);
  const labels = useTuftingStore((s) => s.labels);
  const previewMode = useTuftingStore((s) => s.previewMode);
  const setPreviewMode = useTuftingStore((s) => s.setPreviewMode);
  const isProcessing = useTuftingStore((s) => s.isProcessing);
  const progress = useTuftingStore((s) => s.progress);
  const complexity = useTuftingStore((s) => s.complexity);
  const { t } = useTranslation();

  const MODES: { value: PreviewMode; labelKey: string }[] = [
    { value: "original", labelKey: "preview.original" },
    { value: "reduced", labelKey: "preview.simplified" },
    { value: "contour", labelKey: "preview.contour" },
    { value: "mirrored", labelKey: "preview.mirrored" },
  ];

  const complexityColors: Record<ComplexityRating, string> = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-orange-100 text-orange-800",
    expert: "bg-red-100 text-red-800",
  };

  const canRender = images && labels;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t("preview.title")}
        </h3>
        {complexity && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${complexityColors[complexity.rating]}`}
          >
            {t(`complexity.${complexity.rating}`)}
          </span>
        )}
      </div>

      {canRender && (
        <div className="mb-3 flex gap-1 rounded-lg bg-stone-100 p-1">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setPreviewMode(mode.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                previewMode === mode.value
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t(mode.labelKey)}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            <p className="mt-2 text-sm text-stone-500">
              {progress ? t(`progress.${progress}`) : ""}
            </p>
          </div>
        )}

        {!canRender && !isProcessing && (
          <div className="text-center text-stone-400">
            <p className="text-sm">{t("preview.empty")}</p>
          </div>
        )}

        {canRender && (
          <div className="flex h-full w-full items-center justify-center p-4">
            {previewMode === "reduced" ? (
              <div className="flex h-full w-full gap-4">
                <div className="flex min-h-0 flex-1 flex-col items-center">
                  <span className="mb-1 shrink-0 text-xs text-stone-400">
                    {t("preview.original")}
                  </span>
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <PreviewCanvas mode="original" />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col items-center">
                  <span className="mb-1 shrink-0 text-xs text-stone-400">
                    {t("preview.reduced")}
                  </span>
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <PreviewCanvas mode="reduced" />
                  </div>
                </div>
              </div>
            ) : (
              <PreviewCanvas mode={previewMode} />
            )}
          </div>
        )}
      </div>

      {complexity && canRender && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-stone-500">
          <div className="rounded-md bg-stone-50 p-2">
            <div className="font-medium text-stone-700">
              {complexity.colorRegionCount}
            </div>
            <div>{t("preview.regions")}</div>
          </div>
          <div className="rounded-md bg-stone-50 p-2">
            <div className="font-medium text-stone-700">
              {complexity.isolatedRegionCount}
            </div>
            <div>{t("preview.isolated")}</div>
          </div>
          <div className="rounded-md bg-stone-50 p-2">
            <div className="font-medium text-stone-700">
              {complexity.contourEdgeCount.toLocaleString()}
            </div>
            <div>{t("preview.edges")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
