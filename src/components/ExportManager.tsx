"use client";

import { useState } from "react";
import { useTuftingStore } from "@/store/useTuftingStore";
import { useLocaleStore } from "@/store/useLocaleStore";
import { useTranslation } from "@/hooks/useTranslation";
import { buildColorMapDataUrls } from "@/lib/colorMapExport";
import { exportPng, exportPdf } from "@/services/ExportService";

interface ExportManagerProps {
  embedded?: boolean;
}

export function ExportManager({ embedded = false }: ExportManagerProps) {
  const images = useTuftingStore((s) => s.images);
  const labels = useTuftingStore((s) => s.labels);
  const palette = useTuftingStore((s) => s.palette);
  const materials = useTuftingStore((s) => s.materials);
  const noiseThreshold = useTuftingStore((s) => s.noiseThreshold);
  const colorMapLabelMode = useTuftingStore((s) => s.colorMapLabelMode);
  const showGrid = useTuftingStore((s) => s.showGrid);
  const gridSize = useTuftingStore((s) => s.gridSize);
  const rugSettings = useTuftingStore((s) => s.rugSettings);
  const locale = useLocaleStore((s) => s.locale);
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const hasData = images && palette.length > 0 && materials;

  const getColorMapUrls = () => {
    if (!labels || !images) return null;
    return buildColorMapDataUrls({
      labels,
      width: images.width,
      height: images.height,
      noiseThreshold,
      colorMapLabelMode,
      colorNames: palette.map((c) => c.name),
      showGrid,
      gridSize,
      rugSettings,
    });
  };

  const handlePngExport = async (
    type:
      | "reduced"
      | "contour"
      | "colorMap"
      | "mirroredColorMap"
      | "mirrored"
  ) => {
    if (!images) return;

    if (type === "colorMap" || type === "mirroredColorMap") {
      const colorMaps = getColorMapUrls();
      if (!colorMaps) return;
      const url =
        type === "colorMap" ? colorMaps.colorMap : colorMaps.mirroredColorMap;
      const name =
        type === "colorMap"
          ? "tufting-color-map.png"
          : "tufting-mirrored-color-map.png";
      await exportPng(url, name);
      return;
    }

    const urls = {
      reduced: images.reducedDataUrl,
      contour: images.contourDataUrl,
      mirrored: images.mirroredDataUrl,
    };
    const names = {
      reduced: "tufting-simplified.png",
      contour: "tufting-contour.png",
      mirrored: "tufting-mirrored.png",
    };
    await exportPng(urls[type], names[type]);
  };

  const handlePdfExport = async () => {
    if (!images || !materials) return;
    setExporting(true);
    try {
      const colorMaps = getColorMapUrls();
      await exportPdf(
        {
          ...images,
          colorMapDataUrl: colorMaps?.colorMap ?? images.colorMapDataUrl,
          mirroredColorMapDataUrl:
            colorMaps?.mirroredColorMap ?? images.mirroredColorMapDataUrl,
        },
        palette,
        materials,
        locale
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3
        className={`text-sm font-semibold text-stone-700 uppercase tracking-wide ${
          embedded ? "hidden lg:block" : ""
        }`}
      >
        {t("export.title")}
      </h3>

      <div className="space-y-2">
        <p className="text-xs text-stone-500">{t("export.png")}</p>
        <div className="grid grid-cols-1 gap-1.5">
          {(
            [
              { type: "reduced" as const, labelKey: "export.simplifiedPattern" },
              { type: "contour" as const, labelKey: "export.contourPattern" },
              { type: "colorMap" as const, labelKey: "export.colorMapPattern" },
              {
                type: "mirroredColorMap" as const,
                labelKey: "export.mirroredColorMapPattern",
              },
              { type: "mirrored" as const, labelKey: "export.mirroredPattern" },
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              onClick={() => handlePngExport(item.type)}
              disabled={!hasData}
              className="rounded-md bg-stone-100 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePdfExport}
        disabled={!hasData || exporting}
        className="w-full rounded-md bg-amber-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {exporting ? t("export.generatingPdf") : t("export.exportFullPdf")}
      </button>
    </div>
  );
}
