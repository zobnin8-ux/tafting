"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { getRugAreaSqM, metersToSqFt } from "@/lib/color";

export function MaterialEstimator() {
  const materials = useTuftingStore((s) => s.materials);
  const rugSettings = useTuftingStore((s) => s.rugSettings);
  const palette = useTuftingStore((s) => s.palette);

  if (!materials || palette.length === 0) {
    return (
      <div className="text-center text-sm text-stone-400 py-8">
        Material list will appear after uploading an image
      </div>
    );
  }

  const totalAreaSqM = getRugAreaSqM(
    rugSettings.width,
    rugSettings.height,
    rugSettings.unit
  );
  const totalAreaSqFt = metersToSqFt(totalAreaSqM);
  const totalYarnG = palette.reduce((s, c) => s + c.yarnWeightG, 0);
  const totalSkeins = palette.reduce((s, c) => s + c.skeins, 0);
  const paletteAreaSqM = palette.reduce((s, c) => s + c.areaSqM, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
        Materials List
      </h3>

      <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-stone-700">Rug area:</span>{" "}
            {totalAreaSqM.toFixed(3)} m² / {totalAreaSqFt.toFixed(2)} ft²
          </div>
          <div>
            <span className="font-medium text-stone-700">Color coverage:</span>{" "}
            {paletteAreaSqM.toFixed(3)} m²
          </div>
          <div>
            <span className="font-medium text-stone-700">Total yarn:</span>{" "}
            {totalYarnG}g ({totalSkeins} skeins)
          </div>
          <div>
            <span className="font-medium text-stone-700">Waste factor:</span>{" "}
            {materials.wasteFactorPercent}%
          </div>
        </div>
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Yarn
        </h4>
        <div className="space-y-1.5">
          {materials.yarns.map((yarn) => (
            <div
              key={yarn.hex}
              className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-sm border border-stone-300"
                  style={{ backgroundColor: yarn.hex }}
                />
                <span className="font-medium text-stone-700">{yarn.name}</span>
              </div>
              <span className="text-stone-500">
                {yarn.weightG}g — {yarn.skeins} skein
                {yarn.skeins !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Backing Cloth (+{materials.backingCloth.marginPercent}% margin)
        </h4>
        <div className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600">
          {materials.backingCloth.width.toFixed(1)} ×{" "}
          {materials.backingCloth.height.toFixed(1)}{" "}
          {materials.backingCloth.unit}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Secondary Backing
        </h4>
        <div className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600">
          {materials.secondaryBacking.width.toFixed(1)} ×{" "}
          {materials.secondaryBacking.height.toFixed(1)}{" "}
          {materials.secondaryBacking.unit}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          Glue
        </h4>
        <div className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600">
          {materials.glueMl} ml
        </div>
      </section>
    </div>
  );
}
