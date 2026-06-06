"use client";

import { useEffect, useRef } from "react";
import { useTuftingStore } from "@/store/useTuftingStore";
import { drawToDisplayCanvas, renderPreviewCanvas } from "@/lib/renderPreview";
import type { PreviewMode } from "@/types";

interface PreviewCanvasProps {
  mode: PreviewMode;
}

export function PreviewCanvas({ mode }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labels = useTuftingStore((s) => s.labels);
  const centroids = useTuftingStore((s) => s.centroids);
  const images = useTuftingStore((s) => s.images);
  const originalFile = useTuftingStore((s) => s.originalFile);
  const originalPreviewUrl = useTuftingStore((s) => s.originalPreviewUrl);
  const rugSettings = useTuftingStore((s) => s.rugSettings);
  const showGrid = useTuftingStore((s) => s.showGrid);
  const gridSize = useTuftingStore((s) => s.gridSize);
  const showMirrored = useTuftingStore((s) => s.showMirrored);
  const noiseThreshold = useTuftingStore((s) => s.noiseThreshold);
  const colorMapLabelMode = useTuftingStore((s) => s.colorMapLabelMode);
  const palette = useTuftingStore((s) => s.palette);

  const fitCanvasToContainer = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || canvas.width === 0) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    if (maxW === 0 || maxH === 0) return;

    const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
    canvas.style.width = `${Math.round(canvas.width * scale)}px`;
    canvas.style.height = `${Math.round(canvas.height * scale)}px`;
  };

  useEffect(() => {
    if (!labels || !centroids || !images || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        const source = await renderPreviewCanvas({
          mode,
          labels,
          centroids,
          width: images.width,
          height: images.height,
          originalFile,
          originalPreviewUrl,
          originalDataUrl: images.originalDataUrl,
          preparedDataUrl: images.preparedDataUrl,
          rugSettings,
          showGrid,
          gridSize,
          showMirrored,
          noiseThreshold,
          colorMapLabelMode,
          colorNames: palette.map((c) => c.name),
        });

        if (cancelled || !canvasRef.current) return;
        drawToDisplayCanvas(canvasRef.current, source);
        requestAnimationFrame(fitCanvasToContainer);
      } catch {
        if (cancelled || !canvasRef.current || mode === "reduced") return;

        try {
          const fallback = await renderPreviewCanvas({
            mode: "reduced",
            labels,
            centroids,
            width: images.width,
            height: images.height,
            originalFile,
            originalPreviewUrl,
            originalDataUrl: images.originalDataUrl,
          preparedDataUrl: images.preparedDataUrl,
            rugSettings,
            showGrid,
            gridSize,
            showMirrored: false,
            noiseThreshold,
            colorMapLabelMode,
            colorNames: palette.map((c) => c.name),
          });
          if (!cancelled && canvasRef.current) {
            drawToDisplayCanvas(canvasRef.current, fallback);
            requestAnimationFrame(fitCanvasToContainer);
          }
        } catch {
          // ignore
        }
      }
    };

    void render();

    const container = containerRef.current;
    if (!container) return () => { cancelled = true; };

    const observer = new ResizeObserver(() => fitCanvasToContainer());
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
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
    noiseThreshold,
    colorMapLabelMode,
    palette,
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
