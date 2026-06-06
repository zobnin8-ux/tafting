import {
  PILE_COEFFICIENTS,
  SKEIN_WEIGHT_G,
  BACKING_MARGIN_PERCENT,
  GLUE_ML_PER_SQM,
} from "@/constants";
import {
  getRugAreaSqM,
  metersToSqFt,
  rgbToHex,
  colorDistance,
} from "@/lib/color";
import type { Rgb } from "@/lib/color";
import type {
  PaletteColor,
  MaterialList,
  RugSettings,
  ColorMergeSuggestion,
  ComplexityAnalysis,
  ComplexityRating,
} from "@/types";
import { COLOR_MERGE_THRESHOLD } from "@/constants";

export function buildPalette(
  labels: Int32Array,
  centroids: Rgb[],
  rugSettings: RugSettings,
  tuftingType: RugSettings["tuftingType"],
  pileHeight: RugSettings["pileHeight"],
  wasteFactorPercent: number,
  colorNames: Map<string, string>,
  defaultColorName: (index: number) => string
): PaletteColor[] {
  const totalPixels = labels.length;
  const rugAreaSqM = getRugAreaSqM(
    rugSettings.width,
    rugSettings.height,
    rugSettings.unit
  );
  const pileCoeff = PILE_COEFFICIENTS[tuftingType][pileHeight];
  const wasteMultiplier = 1 + wasteFactorPercent / 100;

  const counts = new Array(centroids.length).fill(0);
  for (const label of labels) {
    counts[label]++;
  }

  return centroids.map((c, i) => {
    const hex = rgbToHex(c.r, c.g, c.b);
    const percentage = (counts[i] / totalPixels) * 100;
    const areaSqM = rugAreaSqM * (counts[i] / totalPixels);
    const areaSqFt = metersToSqFt(areaSqM);
    const yarnWeightG = Math.ceil(areaSqM * pileCoeff * wasteMultiplier);
    const skeins = Math.ceil(yarnWeightG / SKEIN_WEIGHT_G);

    return {
      id: hex,
      hex,
      rgb: { r: c.r, g: c.g, b: c.b },
      name: colorNames.get(hex) ?? defaultColorName(i),
      percentage,
      areaSqM,
      areaSqFt,
      pixelCount: counts[i],
      yarnWeightG,
      skeins,
    };
  });
}

export function buildMaterialList(
  palette: PaletteColor[],
  rugSettings: RugSettings,
  wasteFactorPercent: number
): MaterialList {
  const margin = BACKING_MARGIN_PERCENT / 100;
  const rugAreaSqM = getRugAreaSqM(
    rugSettings.width,
    rugSettings.height,
    rugSettings.unit
  );

  return {
    yarns: palette.map((c) => ({
      name: c.name,
      hex: c.hex,
      weightG: c.yarnWeightG,
      skeins: c.skeins,
    })),
    backingCloth: {
      width: rugSettings.width * (1 + margin),
      height: rugSettings.height * (1 + margin),
      unit: rugSettings.unit,
      marginPercent: BACKING_MARGIN_PERCENT,
    },
    secondaryBacking: {
      width: rugSettings.width,
      height: rugSettings.height,
      unit: rugSettings.unit,
    },
    glueMl: Math.ceil(rugAreaSqM * GLUE_ML_PER_SQM),
    wasteFactorPercent,
  };
}

export function findMergeSuggestions(
  palette: PaletteColor[]
): ColorMergeSuggestion[] {
  const suggestions: ColorMergeSuggestion[] = [];
  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      const dist = colorDistance(palette[i].rgb, palette[j].rgb);
      if (dist < COLOR_MERGE_THRESHOLD) {
        suggestions.push({
          colorAId: palette[i].id,
          colorBId: palette[j].id,
          colorAHex: palette[i].hex,
          colorBHex: palette[j].hex,
        });
      }
    }
  }
  return suggestions;
}

export function analyzeComplexity(
  labels: Int32Array,
  width: number,
  height: number,
  edgeCount: number,
  noiseThreshold: number
): ComplexityAnalysis {
  const visited = new Uint8Array(labels.length);
  let colorRegionCount = 0;
  let isolatedRegionCount = 0;

  const getNeighbors = (idx: number): number[] => {
    const x = idx % width;
    const y = Math.floor(idx / width);
    const neighbors: number[] = [];
    if (x > 0) neighbors.push(idx - 1);
    if (x < width - 1) neighbors.push(idx + 1);
    if (y > 0) neighbors.push(idx - width);
    if (y < height - 1) neighbors.push(idx + width);
    return neighbors;
  };

  for (let i = 0; i < labels.length; i++) {
    if (visited[i]) continue;
    const label = labels[i];
    let size = 0;
    const stack = [i];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited[current] || labels[current] !== label) continue;
      visited[current] = 1;
      size++;
      for (const n of getNeighbors(current)) {
        if (!visited[n] && labels[n] === label) stack.push(n);
      }
    }

    colorRegionCount++;
    if (size < noiseThreshold) isolatedRegionCount++;
  }

  let rating: ComplexityRating = "expert";
  const score =
    colorRegionCount +
    isolatedRegionCount * 2 +
    edgeCount / 1000;

  if (score <= 30) rating = "easy";
  else if (score <= 80) rating = "medium";
  else if (score <= 150) rating = "hard";

  return {
    colorRegionCount,
    isolatedRegionCount,
    contourEdgeCount: edgeCount,
    rating,
  };
}
