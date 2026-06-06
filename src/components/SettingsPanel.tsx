"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  COLOR_COUNT_MIN,
  COLOR_COUNT_MAX,
  GRID_SIZES_IMPERIAL,
  GRID_SIZES_METRIC,
} from "@/constants";
import type { GridSize, PileHeight, TuftingType, Unit } from "@/types";

export function SettingsPanel() {
  const rugSettings = useTuftingStore((s) => s.rugSettings);
  const setRugSettings = useTuftingStore((s) => s.setRugSettings);
  const colorCount = useTuftingStore((s) => s.colorCount);
  const setColorCount = useTuftingStore((s) => s.setColorCount);
  const noiseThreshold = useTuftingStore((s) => s.noiseThreshold);
  const setNoiseThreshold = useTuftingStore((s) => s.setNoiseThreshold);
  const wasteFactorPercent = useTuftingStore((s) => s.wasteFactorPercent);
  const setWasteFactorPercent = useTuftingStore((s) => s.setWasteFactorPercent);
  const showContours = useTuftingStore((s) => s.showContours);
  const setShowContours = useTuftingStore((s) => s.setShowContours);
  const showMirrored = useTuftingStore((s) => s.showMirrored);
  const setShowMirrored = useTuftingStore((s) => s.setShowMirrored);
  const showGrid = useTuftingStore((s) => s.showGrid);
  const setShowGrid = useTuftingStore((s) => s.setShowGrid);
  const gridSize = useTuftingStore((s) => s.gridSize);
  const setGridSize = useTuftingStore((s) => s.setGridSize);
  const commitReprocess = useTuftingStore((s) => s.commitReprocess);
  const hasImage = useTuftingStore((s) => s.images !== null);
  const { t } = useTranslation();

  const gridOptions: GridSize[] =
    rugSettings.unit === "inches"
      ? [...GRID_SIZES_IMPERIAL]
      : [...GRID_SIZES_METRIC];

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t("settings.rugDimensions")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-stone-500">{t("settings.width")}</span>
            <input
              type="number"
              min={1}
              value={rugSettings.width}
              onChange={(e) =>
                setRugSettings({ width: Number(e.target.value) })
              }
              className="mt-0.5 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">{t("settings.height")}</span>
            <input
              type="number"
              min={1}
              value={rugSettings.height}
              onChange={(e) =>
                setRugSettings({ height: Number(e.target.value) })
              }
              className="mt-0.5 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2">
          {(["inches", "centimeters"] as Unit[]).map((unit) => (
            <button
              key={unit}
              onClick={() => setRugSettings({ unit })}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                rugSettings.unit === unit
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t(unit === "inches" ? "settings.inches" : "settings.centimeters")}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t("settings.tuftingType")}
        </h3>
        <div className="flex gap-2">
          {([
            { value: "cut" as TuftingType, labelKey: "settings.cutPile" },
            { value: "loop" as TuftingType, labelKey: "settings.loopPile" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRugSettings({ tuftingType: opt.value })}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                rugSettings.tuftingType === opt.value
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {([
            { value: "low" as PileHeight, labelKey: "settings.pileLow" },
            { value: "medium" as PileHeight, labelKey: "settings.pileMedium" },
            { value: "high" as PileHeight, labelKey: "settings.pileHigh" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRugSettings({ pileHeight: opt.value })}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                rugSettings.pileHeight === opt.value
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t("settings.colorReduction")}
        </h3>
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>{t("settings.colorCount")}</span>
            <span>{colorCount}</span>
          </div>
          <input
            type="range"
            min={COLOR_COUNT_MIN}
            max={COLOR_COUNT_MAX}
            value={colorCount}
            onChange={(e) => setColorCount(Number(e.target.value))}
            onMouseUp={commitReprocess}
            onTouchEnd={commitReprocess}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>{t("settings.noiseThreshold")}</span>
            <span>{noiseThreshold}</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={noiseThreshold}
            onChange={(e) => setNoiseThreshold(Number(e.target.value))}
            onMouseUp={commitReprocess}
            onTouchEnd={commitReprocess}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>{t("settings.wasteFactor")}</span>
            <span>{wasteFactorPercent}</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={wasteFactorPercent}
            onChange={(e) => setWasteFactorPercent(Number(e.target.value))}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          {t("settings.viewOptions")}
        </h3>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showContours}
            onChange={(e) => setShowContours(e.target.checked)}
            disabled={!hasImage}
            className="accent-amber-600"
          />
          {t("settings.showContours")}
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showMirrored}
            onChange={(e) => setShowMirrored(e.target.checked)}
            disabled={!hasImage}
            className="accent-amber-600"
          />
          {t("settings.showMirrored")}
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            disabled={!hasImage}
            className="accent-amber-600"
          />
          {t("settings.enableGrid")}
        </label>
        {showGrid && (
          <div className="flex gap-2">
            {gridOptions.map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  gridSize === size
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
