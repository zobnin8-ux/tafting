"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import { YarnMatchRow } from "@/components/YarnMatchRow";

export function PalettePanel() {
  const palette = useTuftingStore((s) => s.palette);
  const setColorName = useTuftingStore((s) => s.setColorName);
  const mergeSuggestions = useTuftingStore((s) => s.mergeSuggestions);
  const dismissedMerges = useTuftingStore((s) => s.dismissedMerges);
  const mergePaletteColors = useTuftingStore((s) => s.mergePaletteColors);
  const undoLastMerge = useTuftingStore((s) => s.undoLastMerge);
  const mergeUndoStack = useTuftingStore((s) => s.mergeUndoStack);
  const dismissMergeSuggestion = useTuftingStore(
    (s) => s.dismissMergeSuggestion
  );
  const { t, skeinLabel } = useTranslation();

  const activeSuggestions = mergeSuggestions.filter(
    (s) =>
      !dismissedMerges.has(`${s.colorAId}-${s.colorBId}`) &&
      !dismissedMerges.has(`${s.colorBId}-${s.colorAId}`)
  );

  if (palette.length === 0) {
    return (
      <div className="text-center text-sm text-stone-400 py-8">
        {t("palette.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t("palette.title")}
        </h3>
        {mergeUndoStack.length > 0 && (
          <button
            onClick={undoLastMerge}
            className="shrink-0 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            {t("palette.undoMerge")}
          </button>
        )}
      </div>

      {activeSuggestions.length > 0 && (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {activeSuggestions.map((s) => (
            <div
              key={`${s.colorAId}-${s.colorBId}`}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
            >
              <p className="text-stone-700">
                <span
                  className="inline-block h-3 w-3 rounded-sm border border-stone-300"
                  style={{ backgroundColor: s.colorAHex }}
                />{" "}
                {t("palette.mergeSuggestion", {
                  a: s.colorAHex,
                  b: s.colorBHex,
                })}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    mergePaletteColors(s.colorAId, s.colorBId)
                  }
                  className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                >
                  {t("palette.merge")}
                </button>
                <button
                  onClick={() =>
                    dismissMergeSuggestion(s.colorAId, s.colorBId)
                  }
                  className="rounded-md bg-stone-200 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-300"
                >
                  {t("palette.dismiss")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {palette.map((color, index) => (
          <div
            key={color.id}
            className="flex items-start gap-3 rounded-lg border border-stone-200 p-3"
          >
            <div className="relative mt-0.5 shrink-0">
              <div
                className="h-10 w-10 rounded-md border border-stone-300"
                style={{ backgroundColor: color.hex }}
              />
              <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-white">
                {index + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={color.name}
                onChange={(e) => setColorName(color.hex, e.target.value)}
                className="w-full border-b border-transparent bg-transparent text-sm font-medium text-stone-800 hover:border-stone-300 focus:border-amber-500 focus:outline-none"
              />
              <div className="mt-1 space-y-0.5 text-xs text-stone-500">
                <div>{color.hex}</div>
                <div>
                  RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                </div>
                <div>
                  {t("palette.percentOfImage", {
                    p: color.percentage.toFixed(1),
                  })}
                </div>
                <div>
                  {color.areaSqM.toFixed(3)} m² / {color.areaSqFt.toFixed(2)} ft²
                </div>
                <div className="font-medium text-stone-700">
                  {color.yarnWeightG}g — {color.skeins}{" "}
                  {skeinLabel(color.skeins)}
                </div>
                {color.yarnMatches && color.yarnMatches.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-stone-100 pt-2">
                    {color.yarnMatches.map((match) => (
                      <YarnMatchRow key={match.catalogId} match={match} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
