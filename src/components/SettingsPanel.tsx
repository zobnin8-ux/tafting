"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
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
  const hasImage = useTuftingStore((s) => s.images !== null);

  const gridOptions: GridSize[] =
    rugSettings.unit === "inches"
      ? [...GRID_SIZES_IMPERIAL]
      : [...GRID_SIZES_METRIC];

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Rug Dimensions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-stone-500">Width</span>
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
            <span className="text-xs text-stone-500">Height</span>
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
              {unit === "inches" ? "Inches" : "Centimeters"}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Tufting Type
        </h3>
        <div className="flex gap-2">
          {([
            { value: "cut" as TuftingType, label: "Cut Pile" },
            { value: "loop" as TuftingType, label: "Loop Pile" },
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
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {([
            { value: "low" as PileHeight, label: "Low" },
            { value: "medium" as PileHeight, label: "Medium" },
            { value: "high" as PileHeight, label: "High" },
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
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Color Reduction
        </h3>
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Color count</span>
            <span>{colorCount}</span>
          </div>
          <input
            type="range"
            min={COLOR_COUNT_MIN}
            max={COLOR_COUNT_MAX}
            value={colorCount}
            onChange={(e) => setColorCount(Number(e.target.value))}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Noise threshold (px)</span>
            <span>{noiseThreshold}</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={noiseThreshold}
            onChange={(e) => setNoiseThreshold(Number(e.target.value))}
            disabled={!hasImage}
            className="mt-1 w-full accent-amber-600"
          />
        </label>
        <label className="block">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Waste factor (%)</span>
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
          View Options
        </h3>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showContours}
            onChange={(e) => setShowContours(e.target.checked)}
            disabled={!hasImage}
            className="accent-amber-600"
          />
          Show Contours
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showMirrored}
            onChange={(e) => setShowMirrored(e.target.checked)}
            disabled={!hasImage}
            className="accent-amber-600"
          />
          Show Mirrored Pattern
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            disabled={!hasImage}
            className="accent-amber-600"
          />
          Enable Grid
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
