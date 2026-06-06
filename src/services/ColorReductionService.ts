import { kMeansCluster, findNearestCentroid } from "@/lib/kmeans";
import { rgbToHex } from "@/lib/color";
import type { Rgb } from "@/lib/color";
import { createCanvas } from "@/lib/canvas";

export interface ColorReductionResult {
  canvas: HTMLCanvasElement;
  labels: Int32Array;
  centroids: Rgb[];
  width: number;
  height: number;
}

function samplePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampleRate = 4
): Rgb[] {
  const pixels: Rgb[] = [];
  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
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
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
      labels[y * width + x] = findNearestCentroid(pixel, centroids);
    }
  }
  return labels;
}

function labelsToCanvas(
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

export function removeSmallRegions(
  labels: Int32Array,
  width: number,
  height: number,
  threshold: number
): Int32Array {
  const result = new Int32Array(labels);
  const visited = new Uint8Array(labels.length);

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
    const region: number[] = [];
    const stack = [i];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited[current] || labels[current] !== label) continue;
      visited[current] = 1;
      region.push(current);
      for (const n of getNeighbors(current)) {
        if (!visited[n] && labels[n] === label) stack.push(n);
      }
    }

    if (region.length < threshold) {
      const borderCounts = new Map<number, number>();
      for (const idx of region) {
        for (const n of getNeighbors(idx)) {
          if (labels[n] !== label) {
            borderCounts.set(labels[n], (borderCounts.get(labels[n]) ?? 0) + 1);
          }
        }
      }
      let bestLabel = label;
      let bestCount = 0;
      for (const [l, count] of borderCounts) {
        if (count > bestCount) {
          bestCount = count;
          bestLabel = l;
        }
      }
      for (const idx of region) {
        result[idx] = bestLabel;
      }
    }
  }

  return result;
}

export function smoothEdges(
  labels: Int32Array,
  width: number,
  height: number,
  passes = 1
): Int32Array {
  let current = labels;
  for (let pass = 0; pass < passes; pass++) {
    const next = new Int32Array(current);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const counts = new Map<number, number>();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = (y + dy) * width + (x + dx);
            const l = current[nIdx];
            counts.set(l, (counts.get(l) ?? 0) + 1);
          }
        }
        let maxLabel = current[idx];
        let maxCount = 0;
        for (const [l, count] of counts) {
          if (count > maxCount) {
            maxCount = count;
            maxLabel = l;
          }
        }
        next[idx] = maxLabel;
      }
    }
    current = next;
  }
  return current;
}

export function reduceColors(
  sourceCanvas: HTMLCanvasElement,
  colorCount: number,
  noiseThreshold: number
): ColorReductionResult {
  const { width, height } = sourceCanvas;
  const ctx = sourceCanvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, width, height);

  const sampled = samplePixels(imageData.data, width, height);
  const centroids = kMeansCluster(sampled, colorCount);

  let labels = assignLabels(imageData.data, width, height, centroids);
  labels = removeSmallRegions(labels, width, height, noiseThreshold);
  labels = smoothEdges(labels, width, height, 1);

  const finalCentroids = centroids.map((c) => ({
    r: Math.round(c.r),
    g: Math.round(c.g),
    b: Math.round(c.b),
  }));

  const canvas = labelsToCanvas(labels, finalCentroids, width, height);

  return {
    canvas,
    labels,
    centroids: finalCentroids,
    width,
    height,
  };
}

export function mergeColors(
  labels: Int32Array,
  centroids: Rgb[],
  fromIdx: number,
  toIdx: number,
  width: number,
  height: number
): { labels: Int32Array; centroids: Rgb[] } {
  const newLabels = new Int32Array(labels.length);
  const remap = new Map<number, number>();

  for (let i = 0; i < centroids.length; i++) {
    if (i === fromIdx) remap.set(i, toIdx);
    else if (i > fromIdx) remap.set(i, i - 1);
    else remap.set(i, i);
  }

  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];
    if (l === fromIdx) newLabels[i] = toIdx > fromIdx ? toIdx - 1 : toIdx;
    else if (l > fromIdx) newLabels[i] = l - 1;
    else newLabels[i] = l;
  }

  const newCentroids = centroids.filter((_, i) => i !== fromIdx);

  return {
    labels: newLabels,
    centroids: newCentroids,
  };
}

export function getCentroidHex(centroid: Rgb): string {
  return rgbToHex(centroid.r, centroid.g, centroid.b);
}
