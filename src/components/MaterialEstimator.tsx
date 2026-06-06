"use client";

import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import { getRugAreaSqM, metersToSqFt } from "@/lib/color";

export function MaterialEstimator() {
  const materials = useTuftingStore((s) => s.materials);
  const rugSettings = useTuftingStore((s) => s.rugSettings);
  const palette = useTuftingStore((s) => s.palette);
  const { t, skeinLabel, unitLabel } = useTranslation();

  if (!materials || palette.length === 0) {
    return (
      <div className="text-center text-sm text-stone-400 py-8">
        {t("materials.empty")}
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
        {t("materials.title")}
      </h3>

      <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-stone-700">
              {t("materials.rugArea")}
            </span>{" "}
            {totalAreaSqM.toFixed(3)} m² / {totalAreaSqFt.toFixed(2)} ft²
          </div>
          <div>
            <span className="font-medium text-stone-700">
              {t("materials.colorCoverage")}
            </span>{" "}
            {paletteAreaSqM.toFixed(3)} m²
          </div>
          <div>
            <span className="font-medium text-stone-700">
              {t("materials.totalYarn")}
            </span>{" "}
            {totalYarnG}g ({totalSkeins} {skeinLabel(totalSkeins, "materials")})
          </div>
          <div>
            <span className="font-medium text-stone-700">
              {t("materials.wasteFactor")}
            </span>{" "}
            {materials.wasteFactorPercent}%
          </div>
        </div>
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          {t("materials.yarn")}
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
                {yarn.weightG}g — {yarn.skeins}{" "}
                {skeinLabel(yarn.skeins, "materials")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          {t("materials.backingCloth", {
            m: materials.backingCloth.marginPercent,
          })}
        </h4>
        <div className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600">
          {materials.backingCloth.width.toFixed(1)} ×{" "}
          {materials.backingCloth.height.toFixed(1)}{" "}
          {unitLabel(materials.backingCloth.unit)}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          {t("materials.secondaryBacking")}
        </h4>
        <div className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600">
          {materials.secondaryBacking.width.toFixed(1)} ×{" "}
          {materials.secondaryBacking.height.toFixed(1)}{" "}
          {unitLabel(materials.secondaryBacking.unit)}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-stone-500">
          {t("materials.glue")}
        </h4>
        <div className="rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-600">
          {materials.glueMl} ml
        </div>
      </section>
    </div>
  );
}
