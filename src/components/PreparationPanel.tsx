"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import type { SimplificationLevel } from "@/types";

interface PreparationPanelProps {
  embedded?: boolean;
}

export function PreparationPanel({ embedded = false }: PreparationPanelProps) {
  const artworkPrep = useTuftingStore((s) => s.artworkPrepSettings);
  const patchArtworkPrepSettings = useTuftingStore(
    (s) => s.patchArtworkPrepSettings
  );
  const commitArtworkPrepChange = useTuftingStore(
    (s) => s.commitArtworkPrepChange
  );
  const undoPrepSettings = useTuftingStore((s) => s.undoPrepSettings);
  const prepUndoStack = useTuftingStore((s) => s.prepUndoStack);
  const hasImage = useTuftingStore((s) => s.images !== null);
  const { t } = useTranslation();

  const simplificationOptions: Array<{
    value: SimplificationLevel;
    labelKey: string;
  }> = [
    { value: "low", labelKey: "prep.simplificationLow" },
    { value: "medium", labelKey: "prep.simplificationMedium" },
    { value: "strong", labelKey: "prep.simplificationStrong" },
  ];

  const applyNow = (partial: Partial<typeof artworkPrep>) => {
    patchArtworkPrepSettings(partial);
    commitArtworkPrepChange();
  };

  const patch = (partial: Partial<typeof artworkPrep>) => {
    patchArtworkPrepSettings(partial);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3
          className={`text-sm font-semibold text-stone-700 uppercase tracking-wide ${
            embedded ? "hidden lg:block" : ""
          }`}
        >
          {t("prep.title")}
        </h3>
        {prepUndoStack.length > 0 && (
          <button
            onClick={undoPrepSettings}
            disabled={!hasImage}
            className={`shrink-0 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 ${embedded ? "ml-auto" : ""}`}
          >
            {t("prep.undo")}
          </button>
        )}
      </div>

      <p className="text-xs leading-snug text-stone-500">{t("prep.subtitle")}</p>

      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={artworkPrep.removeBackground}
          onChange={(e) => applyNow({ removeBackground: e.target.checked })}
          disabled={!hasImage}
          className="accent-amber-600"
        />
        {t("prep.removeBackground")}
      </label>

      {artworkPrep.removeBackground && (
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>{t("prep.backgroundTolerance")}</span>
            <span>{artworkPrep.backgroundTolerance}</span>
          </div>
          <input
            type="range"
            min={15}
            max={80}
            step={5}
            value={artworkPrep.backgroundTolerance}
            onChange={(e) =>
              patch({ backgroundTolerance: Number(e.target.value) })
            }
            onMouseUp={commitArtworkPrepChange}
            onTouchEnd={commitArtworkPrepChange}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
      )}

      <div className="space-y-1.5">
        <span className="text-xs text-stone-500">{t("prep.simplification")}</span>
        <div className="flex gap-2">
          {simplificationOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyNow({ simplification: opt.value })}
              disabled={!hasImage}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                artworkPrep.simplification === opt.value
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40"
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="flex justify-between text-xs text-stone-500">
          <span>{t("prep.smallRegionPercent")}</span>
          <span>{artworkPrep.smallRegionPercent}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.1}
          value={artworkPrep.smallRegionPercent}
          onChange={(e) =>
            patch({ smallRegionPercent: Number(e.target.value) })
          }
          onMouseUp={commitArtworkPrepChange}
          onTouchEnd={commitArtworkPrepChange}
          disabled={!hasImage}
          className="mt-1 w-full accent-amber-600"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={artworkPrep.thickenThinLines}
          onChange={(e) => applyNow({ thickenThinLines: e.target.checked })}
          disabled={!hasImage}
          className="accent-amber-600"
        />
        {t("prep.thickenThinLines")}
      </label>

      {artworkPrep.thickenThinLines && (
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>{t("prep.minLineWidth")}</span>
            <span>
              {artworkPrep.minLineWidth}px
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={artworkPrep.minLineWidth}
            onChange={(e) => patch({ minLineWidth: Number(e.target.value) })}
            onMouseUp={commitArtworkPrepChange}
            onTouchEnd={commitArtworkPrepChange}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
      )}
    </section>
  );
}
