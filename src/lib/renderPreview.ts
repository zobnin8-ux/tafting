import {
  createCanvas,
  drawGridOverlay,
  loadImageFromDataUrl,
  loadImageFromFile,
  mirrorCanvas,
} from "@/lib/canvas";
import { generateContours } from "@/services/ContourService";
import type { Rgb } from "@/lib/color";
import type { GridSize, PreviewMode, RugSettings } from "@/types";

export function labelsToCanvas(
  labels: Int32Array,
  centroids: Rgb[],
  width: number,
  height: number
): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(width, height);
  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < labels.length; i++) {
    const c = centroids[labels[i]];
    const offset = i * 4;
    imageData.data[offset] = c.r;
    imageData.data[offset + 1] = c.g;
    imageData.data[offset + 2] = c.b;
    imageData.data[offset + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function applyGridIfNeeded(
  canvas: HTMLCanvasElement,
  showGrid: boolean,
  rugSettings: RugSettings,
  gridSize: GridSize
): HTMLCanvasElement {
  if (!showGrid) return canvas;
  return drawGridOverlay(
    canvas,
    rugSettings.width,
    rugSettings.height,
    rugSettings.unit,
    gridSize
  );
}

async function renderOriginal(
  width: number,
  height: number,
  originalFile: File | null,
  originalPreviewUrl: string | null,
  originalDataUrl: string | null
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = createCanvas(width, height);

  const sources = [
    originalFile,
    originalPreviewUrl,
    originalDataUrl,
  ].filter(Boolean) as Array<File | string>;

  for (const source of sources) {
    try {
      const img =
        typeof source === "string"
          ? await loadImageFromDataUrl(source)
          : await loadImageFromFile(source);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas;
    } catch {
      continue;
    }
  }

  throw new Error("Original image unavailable");
}

export interface RenderPreviewParams {
  mode: PreviewMode;
  labels: Int32Array;
  centroids: Rgb[];
  width: number;
  height: number;
  originalFile: File | null;
  originalPreviewUrl: string | null;
  originalDataUrl: string | null;
  rugSettings: RugSettings;
  showGrid: boolean;
  gridSize: GridSize;
  showMirrored: boolean;
}

export async function renderPreviewCanvas(
  params: RenderPreviewParams
): Promise<HTMLCanvasElement> {
  const {
    mode,
    labels,
    centroids,
    width,
    height,
    originalFile,
    originalPreviewUrl,
    originalDataUrl,
    rugSettings,
    showGrid,
    gridSize,
    showMirrored,
  } = params;

  if (mode === "original") {
    return renderOriginal(
      width,
      height,
      originalFile,
      originalPreviewUrl,
      originalDataUrl
    );
  }

  const reduced = labelsToCanvas(labels, centroids, width, height);

  if (mode === "reduced") {
    return applyGridIfNeeded(reduced, showGrid, rugSettings, gridSize);
  }

  if (mode === "contour") {
    const { canvas: contour } = generateContours(labels, width, height);
    const source = showMirrored ? mirrorCanvas(contour) : contour;
    return applyGridIfNeeded(source, showGrid, rugSettings, gridSize);
  }

  const mirrored = mirrorCanvas(reduced);
  return applyGridIfNeeded(mirrored, showGrid, rugSettings, gridSize);
}

export function drawToDisplayCanvas(
  target: HTMLCanvasElement,
  source: HTMLCanvasElement
): void {
  target.width = source.width;
  target.height = source.height;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
}
