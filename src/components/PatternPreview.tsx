"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import type { PreviewMode } from "@/types";

const MODES: { value: PreviewMode; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "reduced", label: "Simplified" },
  { value: "contour", label: "Contour" },
  { value: "mirrored", label: "Mirrored" },
];

export function PatternPreview() {
  const images = useTuftingStore((s) => s.images);
  const previewMode = useTuftingStore((s) => s.previewMode);
  const setPreviewMode = useTuftingStore((s) => s.setPreviewMode);
  const isProcessing = useTuftingStore((s) => s.isProcessing);
  const progress = useTuftingStore((s) => s.progress);
  const complexity = useTuftingStore((s) => s.complexity);

  const showMirrored = useTuftingStore((s) => s.showMirrored);

  const getUrl = (): string | null => {
    if (!images) return null;
    switch (previewMode) {
      case "original":
        return images.originalDataUrl;
      case "contour":
        return showMirrored
          ? images.mirroredContourDataUrl
          : images.contourDataUrl;
      case "mirrored":
        return images.mirroredDataUrl;
      default:
        return showMirrored ? images.mirroredDataUrl : images.reducedDataUrl;
    }
  };

  const url = getUrl();

  const complexityColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-orange-100 text-orange-800",
    expert: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Pattern Preview
        </h3>
        {complexity && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${complexityColors[complexity.rating]}`}
          >
            {complexity.rating}
          </span>
        )}
      </div>

      {images && (
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
              {mode.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            <p className="mt-2 text-sm text-stone-500">{progress}</p>
          </div>
        )}

        {!images && !isProcessing && (
          <div className="text-center text-stone-400">
            <p className="text-sm">Upload an image to see your pattern</p>
          </div>
        )}

        {(url || (previewMode === "original" && images?.originalDataUrl)) && (
          <div className="flex h-full w-full items-center justify-center p-4">
            {previewMode === "reduced" && images?.originalDataUrl ? (
              <div className="flex h-full w-full gap-4">
                <div className="flex flex-1 flex-col items-center">
                  <span className="mb-1 text-xs text-stone-400">Original</span>
                  <img
                    src={images.originalDataUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <span className="mb-1 text-xs text-stone-400">Reduced</span>
                  <img
                    src={url ?? images.reducedDataUrl}
                    alt="Reduced pattern"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <img
                src={
                  previewMode === "original"
                    ? images!.originalDataUrl
                    : url!
                }
                alt="Pattern preview"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        )}
      </div>

      {complexity && images && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-stone-500">
          <div className="rounded-md bg-stone-50 p-2">
            <div className="font-medium text-stone-700">
              {complexity.colorRegionCount}
            </div>
            <div>Regions</div>
          </div>
          <div className="rounded-md bg-stone-50 p-2">
            <div className="font-medium text-stone-700">
              {complexity.isolatedRegionCount}
            </div>
            <div>Isolated</div>
          </div>
          <div className="rounded-md bg-stone-50 p-2">
            <div className="font-medium text-stone-700">
              {complexity.contourEdgeCount.toLocaleString()}
            </div>
            <div>Edges</div>
          </div>
        </div>
      )}
    </div>
  );
}
