import {
  loadImageFromFile,
  imageToCanvas,
  canvasToDataUrl,
  mirrorCanvas,
  drawGridOverlay,
} from "@/lib/canvas";
import { reduceColors } from "./ColorReductionService";
import { generateContours } from "./ContourService";
import { generateColorMap } from "./ColorMapService";
import {
  buildPalette,
  buildMaterialList,
  findMergeSuggestions,
  analyzeComplexity,
} from "./YarnCalculationService";
import type {
  ProcessedImages,
  PaletteColor,
  MaterialList,
  RugSettings,
  ColorMergeSuggestion,
  ComplexityAnalysis,
} from "@/types";
import type { Rgb } from "@/lib/color";
import { labelsToCanvas } from "@/lib/renderPreview";

export interface ProcessingResult {
  images: ProcessedImages;
  labels: Int32Array;
  centroids: Rgb[];
  palette: PaletteColor[];
  materials: MaterialList;
  mergeSuggestions: ColorMergeSuggestion[];
  complexity: ComplexityAnalysis;
}

export async function regenerateOriginalPreview(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const { canvas } = imageToCanvas(img);
  return canvasToDataUrl(canvas);
}

function applyGridToAll(
  canvases: {
    reduced: HTMLCanvasElement;
    contour: HTMLCanvasElement;
    colorMap: HTMLCanvasElement;
    mirrored: HTMLCanvasElement;
    mirroredContour: HTMLCanvasElement;
    mirroredColorMap: HTMLCanvasElement;
  },
  rugSettings: RugSettings,
  gridSize: string
) {
  const overlay = (canvas: HTMLCanvasElement) =>
    drawGridOverlay(
      canvas,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );

  return {
    reduced: overlay(canvases.reduced),
    contour: overlay(canvases.contour),
    colorMap: overlay(canvases.colorMap),
    mirrored: overlay(canvases.mirrored),
    mirroredContour: overlay(canvases.mirroredContour),
    mirroredColorMap: overlay(canvases.mirroredColorMap),
  };
}

function buildDisplayImages(
  originalCanvas: HTMLCanvasElement,
  reduction: { canvas: HTMLCanvasElement; width: number; height: number },
  contourCanvas: HTMLCanvasElement,
  colorMapCanvas: HTMLCanvasElement,
  mirroredReduced: HTMLCanvasElement,
  mirroredContour: HTMLCanvasElement,
  mirroredColorMap: HTMLCanvasElement,
  rugSettings: RugSettings,
  showGrid: boolean,
  gridSize: string
): ProcessedImages {
  let display = {
    reduced: reduction.canvas,
    contour: contourCanvas,
    colorMap: colorMapCanvas,
    mirrored: mirroredReduced,
    mirroredContour,
    mirroredColorMap,
  };

  if (showGrid) {
    display = applyGridToAll(display, rugSettings, gridSize);
  }

  return {
    originalDataUrl: canvasToDataUrl(originalCanvas),
    reducedDataUrl: canvasToDataUrl(display.reduced),
    contourDataUrl: canvasToDataUrl(display.contour),
    colorMapDataUrl: canvasToDataUrl(display.colorMap),
    mirroredDataUrl: canvasToDataUrl(display.mirrored),
    mirroredContourDataUrl: canvasToDataUrl(display.mirroredContour),
    mirroredColorMapDataUrl: canvasToDataUrl(display.mirroredColorMap),
    width: reduction.width,
    height: reduction.height,
  };
}

export async function processImage(
  file: File,
  colorCount: number,
  noiseThreshold: number,
  rugSettings: RugSettings,
  wasteFactorPercent: number,
  colorNames: Map<string, string>,
  showGrid: boolean,
  gridSize: string,
  defaultColorName: (index: number) => string
): Promise<ProcessingResult> {
  const img = await loadImageFromFile(file);
  const { canvas: originalCanvas } = imageToCanvas(img);

  const reduction = reduceColors(originalCanvas, colorCount, noiseThreshold);
  const { canvas: contourCanvas, edgeCount } = generateContours(
    reduction.labels,
    reduction.width,
    reduction.height
  );
  const colorMapCanvas = generateColorMap(
    reduction.labels,
    reduction.width,
    reduction.height,
    noiseThreshold
  );

  const mirroredReduced = mirrorCanvas(reduction.canvas);
  const mirroredContour = mirrorCanvas(contourCanvas);
  const mirroredColorMap = generateColorMap(
    reduction.labels,
    reduction.width,
    reduction.height,
    noiseThreshold,
    "numbers",
    [],
    true
  );

  const images = buildDisplayImages(
    originalCanvas,
    reduction,
    contourCanvas,
    colorMapCanvas,
    mirroredReduced,
    mirroredContour,
    mirroredColorMap,
    rugSettings,
    showGrid,
    gridSize
  );

  const palette = buildPalette(
    reduction.labels,
    reduction.centroids,
    rugSettings,
    rugSettings.tuftingType,
    rugSettings.pileHeight,
    wasteFactorPercent,
    colorNames,
    defaultColorName
  );

  const materials = buildMaterialList(palette, rugSettings, wasteFactorPercent);
  const mergeSuggestions = findMergeSuggestions(palette);
  const complexity = analyzeComplexity(
    reduction.labels,
    reduction.width,
    reduction.height,
    edgeCount,
    noiseThreshold
  );

  return {
    images,
    labels: reduction.labels,
    centroids: reduction.centroids,
    palette,
    materials,
    mergeSuggestions,
    complexity,
  };
}

export function reprocessFromLabels(
  labels: Int32Array,
  centroids: Rgb[],
  width: number,
  height: number,
  rugSettings: RugSettings,
  wasteFactorPercent: number,
  colorNames: Map<string, string>,
  showGrid: boolean,
  gridSize: string,
  defaultColorName: (index: number) => string,
  noiseThreshold = 50
): {
  images: Omit<ProcessedImages, "originalDataUrl">;
  palette: PaletteColor[];
  materials: MaterialList;
  mergeSuggestions: ColorMergeSuggestion[];
  complexity: ComplexityAnalysis;
} {
  const reducedCanvas = labelsToCanvas(labels, centroids, width, height);
  const { canvas: contourCanvas, edgeCount } = generateContours(
    labels,
    width,
    height
  );
  const colorMapCanvas = generateColorMap(
    labels,
    width,
    height,
    noiseThreshold
  );
  const mirroredReduced = mirrorCanvas(reducedCanvas);
  const mirroredContour = mirrorCanvas(contourCanvas);
  const mirroredColorMap = generateColorMap(
    labels,
    width,
    height,
    noiseThreshold,
    "numbers",
    [],
    true
  );

  let display = {
    reduced: reducedCanvas,
    contour: contourCanvas,
    colorMap: colorMapCanvas,
    mirrored: mirroredReduced,
    mirroredContour,
    mirroredColorMap,
  };

  if (showGrid) {
    display = applyGridToAll(display, rugSettings, gridSize);
  }

  const palette = buildPalette(
    labels,
    centroids,
    rugSettings,
    rugSettings.tuftingType,
    rugSettings.pileHeight,
    wasteFactorPercent,
    colorNames,
    defaultColorName
  );

  return {
    images: {
      reducedDataUrl: canvasToDataUrl(display.reduced),
      contourDataUrl: canvasToDataUrl(display.contour),
      colorMapDataUrl: canvasToDataUrl(display.colorMap),
      mirroredDataUrl: canvasToDataUrl(display.mirrored),
      mirroredContourDataUrl: canvasToDataUrl(display.mirroredContour),
      mirroredColorMapDataUrl: canvasToDataUrl(display.mirroredColorMap),
      width,
      height,
    },
    palette,
    materials: buildMaterialList(palette, rugSettings, wasteFactorPercent),
    mergeSuggestions: findMergeSuggestions(palette),
    complexity: analyzeComplexity(
      labels,
      width,
      height,
      edgeCount,
      50
    ),
  };
}
