"use client";

import { useEffect, useRef } from "react";
import { useTuftingStore } from "@/store/useTuftingStore";
import { drawToDisplayCanvas, renderPreviewCanvas } from "@/lib/renderPreview";
import type { PreviewMode } from "@/types";

interface PreviewCanvasProps {
  mode: PreviewMode;
  className?: string;
}

export function PreviewCanvas({ mode, className }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labels = useTuftingStore((s) => s.labels);
  const centroids = useTuftingStore((s) => s.centroids);
  const images = useTuftingStore((s) => s.images);
  const originalFile = useTuftingStore((s) => s.originalFile);
  const originalPreviewUrl = useTuftingStore((s) => s.originalPreviewUrl);
  const rugSettings = useTuftingStore((s) => s.rugSettings);
  const showGrid = useTuftingStore((s) => s.showGrid);
  const gridSize = useTuftingStore((s) => s.gridSize);
  const showMirrored = useTuftingStore((s) => s.showMirrored);

  useEffect(() => {
    if (!labels || !centroids || !images || !canvasRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        const source = await renderPreviewCanvas({
          mode,
          labels,
          centroids,
          width: images.width,
          height: images.height,
          originalFile,
          originalPreviewUrl,
          rugSettings,
          showGrid,
          gridSize,
          showMirrored,
        });

        if (cancelled || !canvasRef.current) return;
        drawToDisplayCanvas(canvasRef.current, source);
      } catch {
        if (cancelled || !canvasRef.current) return;

        if (mode !== "reduced") {
          try {
            const fallback = await renderPreviewCanvas({
              mode: "reduced",
              labels,
              centroids,
              width: images.width,
              height: images.height,
              originalFile,
              originalPreviewUrl,
              rugSettings,
              showGrid,
              gridSize,
              showMirrored: false,
            });
            if (!cancelled && canvasRef.current) {
              drawToDisplayCanvas(canvasRef.current, fallback);
            }
          } catch {
            // ignore
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    labels,
    centroids,
    images,
    originalFile,
    originalPreviewUrl,
    rugSettings,
    showGrid,
    gridSize,
    showMirrored,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "max-h-full max-w-full"}
    />
  );
}
