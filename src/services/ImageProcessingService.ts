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

export interface ProcessingResult {
  images: ProcessedImages;
  labels: Int32Array;
  centroids: Rgb[];
  palette: PaletteColor[];
  materials: MaterialList;
  mergeSuggestions: ColorMergeSuggestion[];
  complexity: ComplexityAnalysis;
}

export async function processImage(
  file: File,
  colorCount: number,
  noiseThreshold: number,
  rugSettings: RugSettings,
  wasteFactorPercent: number,
  colorNames: Map<string, string>,
  showGrid: boolean,
  gridSize: string
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

  const palette = buildPalette(
    reduction.labels,
    reduction.centroids,
    rugSettings,
    rugSettings.tuftingType,
    rugSettings.pileHeight,
    wasteFactorPercent,
    colorNames
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
    images: {
      originalDataUrl: canvasToDataUrl(originalCanvas),
      reducedDataUrl: canvasToDataUrl(displayReduced),
      contourDataUrl: canvasToDataUrl(displayContour),
      mirroredDataUrl: canvasToDataUrl(displayMirrored),
      mirroredContourDataUrl: canvasToDataUrl(displayMirroredContour),
      width: reduction.width,
      height: reduction.height,
    },
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
  gridSize: string
): Pick<
  ProcessingResult,
  "images" | "palette" | "materials" | "mergeSuggestions" | "complexity"
> {
  const { canvas: reducedCanvas } = reduceColorsFromLabels(
    labels,
    centroids,
    width,
    height
  );
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
    colorNames
  );

  return {
    images: {
      originalDataUrl: "",
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

function reduceColorsFromLabels(
  labels: Int32Array,
  centroids: Rgb[],
  width: number,
  height: number
): { canvas: HTMLCanvasElement } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
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
  return { canvas };
}
