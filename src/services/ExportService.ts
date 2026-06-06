import jsPDF from "jspdf";
import type { ProcessedImages, PaletteColor, MaterialList } from "@/types";

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function fitImageToPage(
  img: HTMLImageElement,
  pageWidth: number,
  pageHeight: number,
  margin: number
): { w: number; h: number; x: number; y: number } {
  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return {
    w,
    h,
    x: (pageWidth - w) / 2,
    y: margin,
  };
}

export async function exportPng(dataUrl: string, filename: string): Promise<void> {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportPdf(
  images: ProcessedImages,
  palette: PaletteColor[],
  materials: MaterialList
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  const pages: Array<{ title: string; dataUrl: string }> = [
    { title: "Original Image", dataUrl: images.originalDataUrl },
    { title: "Simplified Pattern", dataUrl: images.reducedDataUrl },
    { title: "Contour Pattern", dataUrl: images.contourDataUrl },
    { title: "Mirrored Pattern", dataUrl: images.mirroredDataUrl },
  ];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page.dataUrl) continue;
    if (i > 0) pdf.addPage();
    const img = await loadImage(page.dataUrl);
    const { w, h, x, y } = fitImageToPage(img, pageWidth, pageHeight - 20, margin);
    pdf.setFontSize(14);
    pdf.text(page.title, margin, 12);
    pdf.addImage(page.dataUrl, "PNG", x, y + 5, w, h);
  }

  // Palette page
  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text("Color Palette", margin, 12);
  let yPos = 25;
  pdf.setFontSize(10);
  for (const color of palette) {
    pdf.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
    pdf.rect(margin, yPos - 4, 8, 8, "F");
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `${color.name} | ${color.hex} | RGB(${color.rgb.r},${color.rgb.g},${color.rgb.b}) | ${color.percentage.toFixed(1)}% | ${color.areaSqM.toFixed(3)} m² | ${color.yarnWeightG}g (${color.skeins} skeins)`,
      margin + 12,
      yPos
    );
    yPos += 10;
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 25;
    }
  }
  // Materials page
  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text("Material List", margin, 12);
  yPos = 25;
  pdf.setFontSize(11);
  pdf.text("Yarn", margin, yPos);
  yPos += 8;
  pdf.setFontSize(10);
  for (const yarn of materials.yarns) {
    pdf.text(
      `• ${yarn.name} (${yarn.hex}): ${yarn.weightG}g — ${yarn.skeins} skein(s)`,
      margin + 4,
      yPos
    );
    yPos += 7;
  }
  yPos += 5;
  pdf.setFontSize(11);
  pdf.text("Backing Cloth (with 10% margin)", margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.text(
    `• ${materials.backingCloth.width.toFixed(1)} × ${materials.backingCloth.height.toFixed(1)} ${materials.backingCloth.unit}`,
    margin + 4,
    yPos
  );
  yPos += 10;
  pdf.setFontSize(11);
  pdf.text("Secondary Backing", margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.text(
    `• ${materials.secondaryBacking.width.toFixed(1)} × ${materials.secondaryBacking.height.toFixed(1)} ${materials.secondaryBacking.unit}`,
    margin + 4,
    yPos
  );
  yPos += 10;
  pdf.setFontSize(11);
  pdf.text("Glue", margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.text(`• ${materials.glueMl} ml`, margin + 4, yPos);
  yPos += 10;
  pdf.setFontSize(10);
  pdf.text(`Waste factor: ${materials.wasteFactorPercent}%`, margin, yPos);

  pdf.save("tufting-pattern.pdf");
}
