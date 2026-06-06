import { generateContours } from "@/services/ContourService";
import type { ColorMapLabelMode } from "@/types";

function mirrorLabels(
  labels: Int32Array,
  width: number,
  height: number
): Int32Array {
  const mirrored = new Int32Array(labels.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      mirrored[y * width + x] = labels[y * width + (width - 1 - x)];
    }
  }
  return mirrored;
}

interface RegionPlacement {
  labelIndex: number;
  cx: number;
  cy: number;
  area: number;
}

function findRegionPlacements(
  labels: Int32Array,
  width: number,
  height: number,
  minRegionSize: number
): RegionPlacement[] {
  const visited = new Uint8Array(labels.length);
  const placements: RegionPlacement[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (visited[start]) continue;

      const label = labels[start];
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      const queue = [start];
      visited[start] = 1;

      while (queue.length > 0) {
        const idx = queue.pop()!;
        const px = idx % width;
        const py = (idx / width) | 0;
        sumX += px;
        sumY += py;
        count++;

        if (px > 0) {
          const left = idx - 1;
          if (!visited[left] && labels[left] === label) {
            visited[left] = 1;
            queue.push(left);
          }
        }
        if (px < width - 1) {
          const right = idx + 1;
          if (!visited[right] && labels[right] === label) {
            visited[right] = 1;
            queue.push(right);
          }
        }
        if (py > 0) {
          const up = idx - width;
          if (!visited[up] && labels[up] === label) {
            visited[up] = 1;
            queue.push(up);
          }
        }
        if (py < height - 1) {
          const down = idx + width;
          if (!visited[down] && labels[down] === label) {
            visited[down] = 1;
            queue.push(down);
          }
        }
      }

      if (count >= minRegionSize) {
        placements.push({
          labelIndex: label,
          cx: sumX / count,
          cy: sumY / count,
          area: count,
        });
      }
    }
  }

  return placements;
}

function fontSizeForArea(area: number): number {
  return Math.round(Math.min(32, Math.max(9, Math.sqrt(area) * 0.4)));
}

function resolveLabelText(
  labelIndex: number,
  labelMode: ColorMapLabelMode,
  colorNames: string[]
): string {
  if (labelMode === "names" && colorNames[labelIndex]) {
    return colorNames[labelIndex];
  }
  return String(labelIndex + 1);
}

function drawFittedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  area: number
): void {
  const maxWidth = Math.sqrt(area) * 1.4;
  let fontSize = fontSizeForArea(area);

  while (fontSize >= 8) {
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize--;
  }

  let displayText = text;
  if (ctx.measureText(displayText).width > maxWidth) {
    while (
      displayText.length > 1 &&
      ctx.measureText(`${displayText}…`).width > maxWidth
    ) {
      displayText = displayText.slice(0, -1);
    }
    if (displayText.length < text.length) {
      displayText = `${displayText}…`;
    }
  }

  ctx.fillStyle = "#555555";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(displayText, cx, cy);
}

export function generateColorMap(
  labels: Int32Array,
  width: number,
  height: number,
  minRegionSize = 50,
  labelMode: ColorMapLabelMode = "numbers",
  colorNames: string[] = [],
  mirrored = false
): HTMLCanvasElement {
  const workingLabels = mirrored ? mirrorLabels(labels, width, height) : labels;
  const { canvas: contour } = generateContours(workingLabels, width, height);
  const ctx = contour.getContext("2d");
  if (!ctx) return contour;

  const placements = findRegionPlacements(
    workingLabels,
    width,
    height,
    minRegionSize
  );

  for (const { labelIndex, cx, cy, area } of placements) {
    const text = resolveLabelText(labelIndex, labelMode, colorNames);
    drawFittedLabel(ctx, text, cx, cy, area);
  }

  return contour;
}
