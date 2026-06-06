import { kMeansCluster, findNearestCentroid } from "@/lib/kmeans";
import { colorDistance, type Rgb } from "@/lib/color";
import { createCanvas } from "@/lib/canvas";
import {
  removeSmallRegions,
  smoothEdges,
} from "@/services/ColorReductionService";
import type {
  ArtworkPrepSettings,
  PrepWarning,
  PrepWarningKey,
  SimplificationLevel,
} from "@/types";

export interface PrepResult {
  canvas: HTMLCanvasElement;
  warnings: PrepWarning[];
}

function getPixel(data: Uint8ClampedArray, idx: number): Rgb {
  const o = idx * 4;
  return { r: data[o], g: data[o + 1], b: data[o + 2] };
}

function setPixel(
  data: Uint8ClampedArray,
  idx: number,
  color: Rgb,
  alpha = 255
): void {
  const o = idx * 4;
  data[o] = color.r;
  data[o + 1] = color.g;
  data[o + 2] = color.b;
  data[o + 3] = alpha;
}

function averageCornerColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Rgb {
  const samples: Rgb[] = [];
  const patch = 6;
  const corners = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ];
  for (const [sx, sy] of corners) {
    for (let y = sy; y < sy + patch && y < height; y++) {
      for (let x = sx; x < sx + patch && x < width; x++) {
        samples.push(getPixel(data, y * width + x));
      }
    }
  }
  const n = samples.length || 1;
  return {
    r: Math.round(samples.reduce((s, c) => s + c.r, 0) / n),
    g: Math.round(samples.reduce((s, c) => s + c.g, 0) / n),
    b: Math.round(samples.reduce((s, c) => s + c.b, 0) / n),
  };
}

function removePlainBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number
): void {
  const bg = averageCornerColor(data, width, height);
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const tryPush = (idx: number) => {
    if (visited[idx]) return;
    if (colorDistance(getPixel(data, idx), bg) > tolerance) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x);
    tryPush((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    tryPush(y * width);
    tryPush(y * width + width - 1);
  }

  const white: Rgb = { r: 255, g: 255, b: 255 };
  while (queue.length > 0) {
    const idx = queue.pop()!;
    setPixel(data, idx, white);
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) tryPush(idx - 1);
    if (x < width - 1) tryPush(idx + 1);
    if (y > 0) tryPush(idx - width);
    if (y < height - 1) tryPush(idx + width);
  }
}

function medianFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray<ArrayBuffer> {
  if (radius <= 0) return new Uint8ClampedArray(data);
  const out = new Uint8ClampedArray(data.length);
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const rs: number[] = [];
      const gs: number[] = [];
      const bs: number[] = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const p = getPixel(data, (y + dy) * width + (x + dx));
          rs.push(p.r);
          gs.push(p.g);
          bs.push(p.b);
        }
      }
      rs.sort((a, b) => a - b);
      gs.sort((a, b) => a - b);
      bs.sort((a, b) => a - b);
      const m = ((rs.length - 1) / 2) | 0;
      setPixel(out, y * width + x, { r: rs[m], g: gs[m], b: bs[m] });
    }
  }
  return out;
}

function prepColorCount(level: SimplificationLevel): number {
  if (level === "low") return 40;
  if (level === "medium") return 28;
  return 16;
}

function prepSmoothPasses(level: SimplificationLevel): number {
  if (level === "low") return 0;
  if (level === "medium") return 1;
  return 2;
}

function prepBlurRadius(level: SimplificationLevel): number {
  if (level === "low") return 0;
  if (level === "medium") return 1;
  return 2;
}

function samplePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  step = 3
): Rgb[] {
  const pixels: Rgb[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = y * width + x;
      if (data[i * 4 + 3] < 128) continue;
      pixels.push(getPixel(data, i));
    }
  }
  return pixels;
}

function assignLabels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  centroids: Rgb[]
): Int32Array {
  const labels = new Int32Array(width * height);
  for (let i = 0; i < labels.length; i++) {
    labels[i] = findNearestCentroid(getPixel(data, i), centroids);
  }
  return labels;
}

function labelsToImageData(
  labels: Int32Array,
  centroids: Rgb[],
  width: number,
  height: number
): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < labels.length; i++) {
    const c = centroids[labels[i]];
    setPixel(data, i, c);
  }
  return data;
}

function thickenThinLines(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minWidth: number
): Uint8ClampedArray<ArrayBuffer> {
  if (minWidth <= 1) return new Uint8ClampedArray(data);
  const out = new Uint8ClampedArray(data.length);
  const passes = minWidth - 1;

  for (let pass = 0; pass < passes; pass++) {
    const snapshot = new Uint8ClampedArray(out);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = getPixel(snapshot, idx);
        let same = 0;
        let different = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const n = getPixel(snapshot, (y + dy) * width + (x + dx));
            if (colorDistance(center, n) < 18) same++;
            else different++;
          }
        }
        if (same <= 2 && different >= 3) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ni = (y + dy) * width + (x + dx);
              setPixel(out, ni, center);
            }
          }
        }
      }
    }
  }
  return out;
}

function countUniqueColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  step = 4
): number {
  const seen = new Set<string>();
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const p = getPixel(data, y * width + x);
      seen.add(`${p.r >> 3},${p.g >> 3},${p.b >> 3}`);
    }
  }
  return seen.size;
}

function countSmallRegions(
  labels: Int32Array,
  width: number,
  height: number,
  threshold: number
): number {
  const visited = new Uint8Array(labels.length);
  let small = 0;
  for (let i = 0; i < labels.length; i++) {
    if (visited[i]) continue;
    const label = labels[i];
    let size = 0;
    const stack = [i];
    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited[idx] || labels[idx] !== label) continue;
      visited[idx] = 1;
      size++;
      const x = idx % width;
      const y = (idx / width) | 0;
      if (x > 0) stack.push(idx - 1);
      if (x < width - 1) stack.push(idx + 1);
      if (y > 0) stack.push(idx - width);
      if (y < height - 1) stack.push(idx + width);
    }
    if (size < threshold) small++;
  }
  return small;
}

function estimateThinLineRatio(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  step = 3
): number {
  let thin = 0;
  let edge = 0;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = y * width + x;
      const c = getPixel(data, idx);
      const neighbors = [
        getPixel(data, idx - 1),
        getPixel(data, idx + 1),
        getPixel(data, idx - width),
        getPixel(data, idx + width),
      ];
      const maxDiff = Math.max(
        ...neighbors.map((n) => colorDistance(c, n))
      );
      if (maxDiff < 25) continue;
      edge++;
      let same = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (colorDistance(c, getPixel(data, (y + dy) * width + (x + dx))) < 18) {
            same++;
          }
        }
      }
      if (same <= 2) thin++;
    }
  }
  return edge === 0 ? 0 : thin / edge;
}

function estimateGradientScore(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  const block = 12;
  let gradientBlocks = 0;
  let total = 0;
  for (let y = 0; y < height - block; y += block) {
    for (let x = 0; x < width - block; x += block) {
      const vals: number[] = [];
      for (let dy = 0; dy < block; dy++) {
        for (let dx = 0; dx < block; dx++) {
          const p = getPixel(data, (y + dy) * width + (x + dx));
          vals.push((p.r + p.g + p.b) / 3);
        }
      }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance =
        vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      total++;
      if (variance > 180) gradientBlocks++;
    }
  }
  return total === 0 ? 0 : gradientBlocks / total;
}

function estimateTextLikelihood(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let textLike = 0;
  let samples = 0;
  const block = 24;
  for (let y = 0; y < height - block; y += block) {
    for (let x = 0; x < width - block; x += block) {
      let edgeCount = 0;
      for (let dy = 1; dy < block - 1; dy++) {
        for (let dx = 1; dx < block - 1; dx++) {
          const idx = (y + dy) * width + (x + dx);
          const c = getPixel(data, idx);
          const hDiff = colorDistance(c, getPixel(data, idx + 1));
          const vDiff = colorDistance(c, getPixel(data, idx + width));
          if (hDiff > 35 || vDiff > 35) edgeCount++;
        }
      }
      samples++;
      const density = edgeCount / ((block - 2) * (block - 2));
      if (density > 0.22 && density < 0.55) textLike++;
    }
  }
  return samples === 0 ? 0 : textLike / samples;
}

function buildWarnings(
  originalData: Uint8ClampedArray,
  width: number,
  height: number,
  settings: ArtworkPrepSettings,
  colorCount: number
): PrepWarning[] {
  const warnings: PrepWarning[] = [];
  const push = (key: PrepWarningKey, severity: PrepWarning["severity"]) => {
    warnings.push({ key, severity });
  };

  const totalPixels = width * height;
  const regionThreshold = Math.max(
    8,
    Math.round((settings.smallRegionPercent / 100) * totalPixels)
  );

  let smallRegions = 0;
  const sampled = samplePixels(originalData, width, height, 4);
  if (sampled.length > 0) {
    const quickCentroids = kMeansCluster(
      sampled,
      Math.min(24, sampled.length)
    );
    if (quickCentroids.length > 0) {
      const quickLabels = assignLabels(
        originalData,
        width,
        height,
        quickCentroids
      );
      smallRegions = countSmallRegions(
        quickLabels,
        width,
        height,
        regionThreshold
      );
    }
  }
  const uniqueColors = countUniqueColors(originalData, width, height);
  const thinRatio = estimateThinLineRatio(originalData, width, height);
  const gradientScore = estimateGradientScore(originalData, width, height);
  const textScore = estimateTextLikelihood(originalData, width, height);

  if (width < 400 || height < 400 || totalPixels < 120000) {
    push("lowResolution", "warning");
  }
  if (smallRegions > 12) {
    push("tooManySmallDetails", smallRegions > 30 ? "error" : "warning");
  }
  if (uniqueColors > 80 || colorCount > 20) {
    push("tooManyColors", colorCount > 24 ? "error" : "warning");
  }
  if (thinRatio > 0.35) {
    push("thinLines", thinRatio > 0.5 ? "error" : "warning");
  }
  if (gradientScore > 0.18) {
    push("gradientsDetected", gradientScore > 0.3 ? "warning" : "info");
  }
  if (textScore > 0.12) {
    push("textDetected", "warning");
  }
  if (settings.simplification === "low" && smallRegions > 8) {
    push("increaseSimplification", "info");
  }

  return warnings;
}

function imageDataToCanvas(
  data: Uint8ClampedArray,
  width: number,
  height: number
): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(width, height);
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(data);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function prepareArtwork(
  sourceCanvas: HTMLCanvasElement,
  settings: ArtworkPrepSettings,
  colorCount: number
): PrepResult {
  const { width, height } = sourceCanvas;
  const ctx = sourceCanvas.getContext("2d")!;
  let data: Uint8ClampedArray = new Uint8ClampedArray(
    ctx.getImageData(0, 0, width, height).data
  );

  const warnings = buildWarnings(data, width, height, settings, colorCount);

  if (settings.removeBackground) {
    removePlainBackground(data, width, height, settings.backgroundTolerance);
  }

  data = medianFilter(data, width, height, prepBlurRadius(settings.simplification));

  const sampled = samplePixels(data, width, height);
  if (sampled.length === 0) {
    return {
      canvas: sourceCanvas,
      warnings,
    };
  }

  const rawCentroids = kMeansCluster(
    sampled,
    Math.min(prepColorCount(settings.simplification), sampled.length)
  );
  if (rawCentroids.length === 0) {
    return {
      canvas: sourceCanvas,
      warnings,
    };
  }

  const centroids = rawCentroids.map((c) => ({
    r: Math.round(c.r),
    g: Math.round(c.g),
    b: Math.round(c.b),
  }));

  let labels = assignLabels(data, width, height, centroids);
  const regionThreshold = Math.max(
    8,
    Math.round((settings.smallRegionPercent / 100) * width * height)
  );
  labels = removeSmallRegions(labels, width, height, regionThreshold);
  labels = smoothEdges(
    labels,
    width,
    height,
    prepSmoothPasses(settings.simplification)
  );

  let resultData = labelsToImageData(labels, centroids, width, height);

  if (settings.thickenThinLines) {
    resultData = thickenThinLines(
      resultData,
      width,
      height,
      settings.minLineWidth
    );
  }

  return {
    canvas: imageDataToCanvas(resultData, width, height),
    warnings,
  };
}
