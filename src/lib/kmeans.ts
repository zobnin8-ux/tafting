import type { Rgb } from "./color";

function euclideanDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
  );
}

function kMeansPlusPlusInit(pixels: Rgb[], k: number): Rgb[] {
  const centroids: Rgb[] = [];
  const firstIdx = Math.floor(Math.random() * pixels.length);
  centroids.push({ ...pixels[firstIdx] });

  for (let i = 1; i < k; i++) {
    const distances = pixels.map((p) => {
      const minDist = Math.min(
        ...centroids.map((c) => euclideanDistance(p, c))
      );
      return minDist * minDist;
    });
    const total = distances.reduce((s, d) => s + d, 0);
    let threshold = Math.random() * total;
    for (let j = 0; j < pixels.length; j++) {
      threshold -= distances[j];
      if (threshold <= 0) {
        centroids.push({ ...pixels[j] });
        break;
      }
    }
    if (centroids.length <= i) {
      centroids.push({ ...pixels[Math.floor(Math.random() * pixels.length)] });
    }
  }
  return centroids;
}

export function kMeansCluster(
  pixels: Rgb[],
  k: number,
  maxIterations = 20
): Rgb[] {
  if (pixels.length === 0 || k <= 0) return [];
  const effectiveK = Math.min(k, pixels.length);
  let centroids = kMeansPlusPlusInit(pixels, effectiveK);

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters: Rgb[][] = Array.from({ length: effectiveK }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let clusterIdx = 0;
      for (let i = 0; i < centroids.length; i++) {
        const dist = euclideanDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = i;
        }
      }
      clusters[clusterIdx].push(pixel);
    }

    let changed = false;
    for (let i = 0; i < effectiveK; i++) {
      if (clusters[i].length === 0) continue;
      const newCentroid: Rgb = {
        r: clusters[i].reduce((s, p) => s + p.r, 0) / clusters[i].length,
        g: clusters[i].reduce((s, p) => s + p.g, 0) / clusters[i].length,
        b: clusters[i].reduce((s, p) => s + p.b, 0) / clusters[i].length,
      };
      if (euclideanDistance(newCentroid, centroids[i]) > 1) {
        changed = true;
      }
      centroids[i] = newCentroid;
    }
    if (!changed) break;
  }

  return centroids;
}

export function findNearestCentroid(
  pixel: Rgb,
  centroids: Rgb[]
): number {
  let minDist = Infinity;
  let idx = 0;
  for (let i = 0; i < centroids.length; i++) {
    const dist = euclideanDistance(pixel, centroids[i]);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}
