import {
  loadImageFromFile,
  imageToCanvas,
  canvasToDataUrl,
  mirrorCanvas,
  drawGridOverlay,
} from "@/lib/canvas";
import { reduceColors } from "./ColorReductionService";
import { generateContours } from "./ContourService";
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

function buildDisplayImages(
  originalCanvas: HTMLCanvasElement,
  reduction: { canvas: HTMLCanvasElement; width: number; height: number },
  contourCanvas: HTMLCanvasElement,
  mirroredReduced: HTMLCanvasElement,
  mirroredContour: HTMLCanvasElement,
  rugSettings: RugSettings,
  showGrid: boolean,
  gridSize: string
): ProcessedImages {
  let displayReduced = reduction.canvas;
  let displayContour = contourCanvas;
  let displayMirrored = mirroredReduced;
  let displayMirroredContour = mirroredContour;

  if (showGrid) {
    displayReduced = drawGridOverlay(
      reduction.canvas,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
    displayContour = drawGridOverlay(
      contourCanvas,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
    displayMirrored = drawGridOverlay(
      mirroredReduced,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
    displayMirroredContour = drawGridOverlay(
      mirroredContour,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
  }

  return {
    originalDataUrl: canvasToDataUrl(originalCanvas),
    reducedDataUrl: canvasToDataUrl(displayReduced),
    contourDataUrl: canvasToDataUrl(displayContour),
    mirroredDataUrl: canvasToDataUrl(displayMirrored),
    mirroredContourDataUrl: canvasToDataUrl(displayMirroredContour),
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

  const mirroredReduced = mirrorCanvas(reduction.canvas);
  const mirroredContour = mirrorCanvas(contourCanvas);

  const images = buildDisplayImages(
    originalCanvas,
    reduction,
    contourCanvas,
    mirroredReduced,
    mirroredContour,
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
  defaultColorName: (index: number) => string
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
  const mirroredReduced = mirrorCanvas(reducedCanvas);
  const mirroredContour = mirrorCanvas(contourCanvas);

  let displayReduced = reducedCanvas;
  let displayContour = contourCanvas;
  let displayMirrored = mirroredReduced;
  let displayMirroredContour = mirroredContour;

  if (showGrid) {
    displayReduced = drawGridOverlay(
      reducedCanvas,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
    displayContour = drawGridOverlay(
      contourCanvas,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
    displayMirrored = drawGridOverlay(
      mirroredReduced,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
    displayMirroredContour = drawGridOverlay(
      mirroredContour,
      rugSettings.width,
      rugSettings.height,
      rugSettings.unit,
      gridSize
    );
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
      reducedDataUrl: canvasToDataUrl(displayReduced),
      contourDataUrl: canvasToDataUrl(displayContour),
      mirroredDataUrl: canvasToDataUrl(displayMirrored),
      mirroredContourDataUrl: canvasToDataUrl(displayMirroredContour),
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
