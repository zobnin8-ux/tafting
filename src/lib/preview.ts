import type { PreviewMode, ProcessedImages } from "@/types";

export function isValidDataUrl(url?: string | null): boolean {
  return !!url && url.startsWith("data:image") && url.length > 64;
}

export function resolvePreviewUrl(
  images: ProcessedImages,
  mode: PreviewMode,
  originalPreviewUrl: string | null,
  showMirrored: boolean
): string | null {
  const original = isValidDataUrl(originalPreviewUrl)
    ? originalPreviewUrl
    : isValidDataUrl(images.originalDataUrl)
      ? images.originalDataUrl
      : null;
  const reduced = isValidDataUrl(images.reducedDataUrl)
    ? images.reducedDataUrl
    : null;
  const contour = isValidDataUrl(images.contourDataUrl)
    ? images.contourDataUrl
    : null;
  const mirroredContour = isValidDataUrl(images.mirroredContourDataUrl)
    ? images.mirroredContourDataUrl
    : null;
  const mirrored = isValidDataUrl(images.mirroredDataUrl)
    ? images.mirroredDataUrl
    : null;
  const colorMap = isValidDataUrl(images.colorMapDataUrl)
    ? images.colorMapDataUrl
    : null;
  const mirroredColorMap = isValidDataUrl(images.mirroredColorMapDataUrl)
    ? images.mirroredColorMapDataUrl
    : null;

  switch (mode) {
    case "original":
      return original ?? reduced;
    case "reduced":
      return reduced ?? original;
    case "contour":
      if (showMirrored) return mirroredContour ?? contour ?? reduced;
      return contour ?? mirroredContour ?? reduced;
    case "colorMap":
      return colorMap ?? contour;
    case "mirroredColorMap":
      return mirroredColorMap ?? colorMap ?? contour;
    case "mirrored":
      return mirrored ?? reduced;
    default:
      return reduced ?? original;
  }
}
