import { createCanvas } from "@/lib/canvas";

export function generateContours(
  labels: Int32Array,
  width: number,
  height: number
): { canvas: HTMLCanvasElement; edgeCount: number } {
  const { canvas, ctx } = createCanvas(width, height);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.createImageData(width, height);
  let edgeCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const label = labels[idx];
      let isEdge = false;

      if (x > 0 && labels[idx - 1] !== label) isEdge = true;
      if (x < width - 1 && labels[idx + 1] !== label) isEdge = true;
      if (y > 0 && labels[idx - width] !== label) isEdge = true;
      if (y < height - 1 && labels[idx + width] !== label) isEdge = true;

      const offset = idx * 4;
      if (isEdge) {
        imageData.data[offset] = 0;
        imageData.data[offset + 1] = 0;
        imageData.data[offset + 2] = 0;
        imageData.data[offset + 3] = 255;
        edgeCount++;
      } else {
        imageData.data[offset] = 255;
        imageData.data[offset + 1] = 255;
        imageData.data[offset + 2] = 255;
        imageData.data[offset + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { canvas, edgeCount };
}

export function generateContoursFromCanvas(
  source: HTMLCanvasElement
): HTMLCanvasElement {
  const { width, height } = source;
  const srcCtx = source.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, width, height).data;

  const { canvas, ctx } = createCanvas(width, height);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = srcData[idx];
      const g = srcData[idx + 1];
      const b = srcData[idx + 2];
      let isEdge = false;

      const checkNeighbor = (nx: number, ny: number) => {
        const ni = (ny * width + nx) * 4;
        return (
          srcData[ni] !== r ||
          srcData[ni + 1] !== g ||
          srcData[ni + 2] !== b
        );
      };

      if (x > 0 && checkNeighbor(x - 1, y)) isEdge = true;
      if (x < width - 1 && checkNeighbor(x + 1, y)) isEdge = true;
      if (y > 0 && checkNeighbor(x, y - 1)) isEdge = true;
      if (y < height - 1 && checkNeighbor(x, y + 1)) isEdge = true;

      if (isEdge) {
        imageData.data[idx] = 0;
        imageData.data[idx + 1] = 0;
        imageData.data[idx + 2] = 0;
        imageData.data[idx + 3] = 255;
      } else {
        imageData.data[idx] = 255;
        imageData.data[idx + 1] = 255;
        imageData.data[idx + 2] = 255;
        imageData.data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
