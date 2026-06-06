export type Unit = "inches" | "centimeters";
export type TuftingType = "cut" | "loop";
export type PileHeight = "low" | "medium" | "high";
export type ComplexityRating = "easy" | "medium" | "hard" | "expert";
export type GridSize = "1in" | "2in" | "5cm" | "10cm";
export type PreviewMode =
  | "original"
  | "reduced"
  | "contour"
  | "colorMap"
  | "mirroredColorMap"
  | "mirrored";

export type ColorMapLabelMode = "numbers" | "names";

export interface RugSettings {
  width: number;
  height: number;
  unit: Unit;
  tuftingType: TuftingType;
  pileHeight: PileHeight;
}

export interface PaletteColor {
  id: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  name: string;
  percentage: number;
  areaSqM: number;
  areaSqFt: number;
  pixelCount: number;
  yarnWeightG: number;
  skeins: number;
}

export interface ColorMergeSuggestion {
  colorAId: string;
  colorBId: string;
  colorAHex: string;
  colorBHex: string;
}

export interface ComplexityAnalysis {
  colorRegionCount: number;
  isolatedRegionCount: number;
  contourEdgeCount: number;
  rating: ComplexityRating;
}

export interface MaterialList {
  yarns: Array<{
    name: string;
    hex: string;
    weightG: number;
    skeins: number;
  }>;
  backingCloth: {
    width: number;
    height: number;
    unit: Unit;
    marginPercent: number;
  };
  secondaryBacking: {
    width: number;
    height: number;
    unit: Unit;
  };
  glueMl: number;
  wasteFactorPercent: number;
}

export interface ProcessedImages {
  originalDataUrl: string;
  reducedDataUrl: string;
  contourDataUrl: string;
  colorMapDataUrl: string;
  mirroredDataUrl: string;
  mirroredContourDataUrl: string;
  mirroredColorMapDataUrl: string;
  width: number;
  height: number;
}

export type ProgressKey = "processing" | "reprocessing";
export type ErrorKey = "processingFailed" | "reprocessingFailed";

export interface MergeUndoSnapshot {
  labels: Int32Array;
  centroids: Array<{ r: number; g: number; b: number }>;
  colorCount: number;
  colorNames: Map<string, string>;
}

export interface ProcessingState {
  isProcessing: boolean;
  error: ErrorKey | null;
  progress: ProgressKey | null;
}
