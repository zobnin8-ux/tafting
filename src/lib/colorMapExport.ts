import { canvasToDataUrl, drawGridOverlay } from "@/lib/canvas";
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

  const colorMapCanvas = generateColorMap(
    labels,
    width,
    height,
    noiseThreshold,
    colorMapLabelMode,
    colorNames,
    false
  );
  const mirroredColorMapCanvas = generateColorMap(
    labels,
    width,
    height,
    noiseThreshold,
    colorMapLabelMode,
    colorNames,
    true
  );
  const colorMap = canvasToDataUrl(
    withGrid(colorMapCanvas, showGrid, rugSettings, gridSize)
  );
  const mirroredColorMap = canvasToDataUrl(
    withGrid(mirroredColorMapCanvas, showGrid, rugSettings, gridSize)
  );

  return { colorMap, mirroredColorMap };
}
