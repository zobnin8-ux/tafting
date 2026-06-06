"use client";

import { useState } from "react";
import { useTuftingStore } from "@/store/useTuftingStore";
import { exportPng, exportPdf } from "@/services/ExportService";

export function ExportManager() {
  const images = useTuftingStore((s) => s.images);
  const palette = useTuftingStore((s) => s.palette);
  const materials = useTuftingStore((s) => s.materials);
  const [exporting, setExporting] = useState(false);

  const hasData = images && palette.length > 0 && materials;

  const handlePngExport = async (type: "reduced" | "contour" | "mirrored") => {
    if (!images) return;
    const urls = {
      reduced: images.reducedDataUrl,
      contour: images.contourDataUrl,
      mirrored: images.mirroredDataUrl,
    };
    await exportPng(urls[type], `tufting-${type}.png`);
  };

  const handlePdfExport = async () => {
    if (!images || !materials) return;
    setExporting(true);
    try {
      await exportPdf(images, palette, materials);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
        Export
      </h3>

      <div className="space-y-2">
        <p className="text-xs text-stone-500">PNG</p>
        <div className="grid grid-cols-1 gap-1.5">
          {(
            [
              { type: "reduced" as const, label: "Simplified Pattern" },
              { type: "contour" as const, label: "Contour Pattern" },
              { type: "mirrored" as const, label: "Mirrored Pattern" },
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              onClick={() => handlePngExport(item.type)}
              disabled={!hasData}
              className="rounded-md bg-stone-100 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePdfExport}
        disabled={!hasData || exporting}
        className="w-full rounded-md bg-amber-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {exporting ? "Generating PDF..." : "Export Full PDF"}
      </button>
    </div>
  );
}
