import type { PileHeight, TuftingType } from "@/types";

export const COLOR_COUNT_MIN = 4;
export const COLOR_COUNT_MAX = 32;
export const COLOR_COUNT_DEFAULT = 12;

export const NOISE_THRESHOLD_DEFAULT = 50;
export const WASTE_FACTOR_DEFAULT = 15;
export const BACKING_MARGIN_PERCENT = 10;
export const GLUE_ML_PER_SQM = 250;
export const SKEIN_WEIGHT_G = 100;

export const PILE_COEFFICIENTS: Record<
  TuftingType,
  Record<PileHeight, number>
> = {
  cut: { low: 600, medium: 900, high: 1200 },
  loop: { low: 500, medium: 800, high: 1000 },
};

export const GRID_SIZES_IMPERIAL = ["1in", "2in"] as const;
export const GRID_SIZES_METRIC = ["5cm", "10cm"] as const;

export const COMPLEXITY_THRESHOLDS = {
  easy: { regions: 20, isolated: 5, edges: 5000 },
  medium: { regions: 50, isolated: 15, edges: 15000 },
  hard: { regions: 100, isolated: 30, edges: 30000 },
} as const;

export const COLOR_MERGE_THRESHOLD = 15;

export const DEFAULT_RUG_SETTINGS = {
  width: 24,
  height: 36,
  unit: "inches" as const,
  tuftingType: "cut" as const,
  pileHeight: "medium" as const,
};
