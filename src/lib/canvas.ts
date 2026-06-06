export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export function createCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  return { canvas, ctx };
}

export function imageToCanvas(
  img: HTMLImageElement,
  maxDimension = 800
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const { canvas, ctx } = createCanvas(width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, ctx };
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

export function mirrorCanvas(
  source: HTMLCanvasElement
): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(source.width, source.height);
  ctx.translate(source.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

export function drawGridOverlay(
  canvas: HTMLCanvasElement,
  rugWidth: number,
  rugHeight: number,
  unit: "inches" | "centimeters",
  gridSize: string
): HTMLCanvasElement {
  const { canvas: result, ctx } = createCanvas(canvas.width, canvas.height);
  ctx.drawImage(canvas, 0, 0);

  let gridUnitM: number;
  if (gridSize === "1in") gridUnitM = 0.0254;
  else if (gridSize === "2in") gridUnitM = 0.0508;
  else if (gridSize === "5cm") gridUnitM = 0.05;
  else gridUnitM = 0.1;

  const rugWidthM =
    unit === "inches" ? rugWidth * 0.0254 : rugWidth / 100;
  const rugHeightM =
    unit === "inches" ? rugHeight * 0.0254 : rugHeight / 100;

  const pixelsPerMeterX = canvas.width / rugWidthM;
  const pixelsPerMeterY = canvas.height / rugHeightM;
  const gridPxX = gridUnitM * pixelsPerMeterX;
  const gridPxY = gridUnitM * pixelsPerMeterY;

  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += gridPxX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gridPxY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  return result;
}
