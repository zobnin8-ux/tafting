import { canvasToDataUrl, drawGridOverlay, mirrorCanvas } from "@/lib/canvas";
import { generateColorMap } from "@/services/ColorMapService";
import type { ColorMapLabelMode, GridSize, RugSettings } from "@/types";

interface BuildColorMapUrlsParams {
  labels: Int32Array;
  width: number;
  height: number;
  noiseThreshold: number;
  colorMapLabelMode: ColorMapLabelMode;
  colorNames: string[];
  showGrid: boolean;
  gridSize: GridSize;
  rugSettings: RugSettings;
}

function withGrid(
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

export function buildColorMapDataUrls(
  params: BuildColorMapUrlsParams
): { colorMap: string; mirroredColorMap: string } {
  const {
    labels,
    width,
    height,
    noiseThreshold,
    colorMapLabelMode,
    colorNames,
    showGrid,
    gridSize,
    rugSettings,
  } = params;

  const base = generateColorMap(
    labels,
    width,
    height,
    noiseThreshold,
    colorMapLabelMode,
    colorNames
  );
  const colorMap = canvasToDataUrl(
    withGrid(base, showGrid, rugSettings, gridSize)
  );
  const mirroredColorMap = canvasToDataUrl(
    withGrid(mirrorCanvas(base), showGrid, rugSettings, gridSize)
  );

  return { colorMap, mirroredColorMap };
}
