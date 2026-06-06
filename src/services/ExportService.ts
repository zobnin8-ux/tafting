import jsPDF from "jspdf";
import { translate, getSkeinLabel, getUnitLabel, type Locale } from "@/i18n";
import { formatYarnMatchLabel } from "@/services/YarnMatchService";
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
  materials: MaterialList,
  locale: Locale
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  const pages: Array<{ title: string; dataUrl: string }> = [
    { title: translate(locale, "pdf.originalImage"), dataUrl: images.originalDataUrl },
    {
      title: translate(locale, "pdf.preparedArtwork"),
      dataUrl: images.preparedDataUrl,
    },
    { title: translate(locale, "pdf.simplifiedPattern"), dataUrl: images.reducedDataUrl },
    { title: translate(locale, "pdf.contourPattern"), dataUrl: images.contourDataUrl },
    { title: translate(locale, "pdf.colorMapPattern"), dataUrl: images.colorMapDataUrl },
    {
      title: translate(locale, "pdf.mirroredColorMapPattern"),
      dataUrl: images.mirroredColorMapDataUrl,
    },
    { title: translate(locale, "pdf.mirroredPattern"), dataUrl: images.mirroredDataUrl },
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

  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text(translate(locale, "pdf.colorPalette"), margin, 12);
  let yPos = 25;
  pdf.setFontSize(10);
  for (let i = 0; i < palette.length; i++) {
    const color = palette[i];
    pdf.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
    pdf.rect(margin, yPos - 4, 8, 8, "F");
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `${i + 1}. ${color.name} | ${color.hex} | RGB(${color.rgb.r},${color.rgb.g},${color.rgb.b}) | ${color.percentage.toFixed(1)}% | ${color.areaSqM.toFixed(3)} m² | ${color.yarnWeightG}g (${color.skeins} ${getSkeinLabel(locale, color.skeins, "pdf")})`,
      margin + 12,
      yPos
    );
    yPos += 7;
    if (color.yarnMatches && color.yarnMatches.length > 0) {
      pdf.setFontSize(9);
      const matches = color.yarnMatches
        .map((match) => {
          const prefix =
            match.catalogId === "dmc"
              ? translate(locale, "yarn.catalogDmc")
              : translate(locale, "yarn.catalogTuftTheWorld");
          return `${prefix}: ${formatYarnMatchLabel(match)}`;
        })
        .join(" | ");
      pdf.text(`→ ${matches}`, margin + 12, yPos);
      yPos += 6;
      pdf.setFontSize(10);
    }
    yPos += 3;
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 25;
    }
  }

  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text(translate(locale, "pdf.materialList"), margin, 12);
  yPos = 25;
  pdf.setFontSize(11);
  pdf.text(translate(locale, "pdf.yarn"), margin, yPos);
  yPos += 8;
  pdf.setFontSize(10);
  for (const yarn of materials.yarns) {
    pdf.text(
      `• ${yarn.name} (${yarn.hex}): ${yarn.weightG}g — ${yarn.skeins} ${getSkeinLabel(locale, yarn.skeins, "pdf")}`,
      margin + 4,
      yPos
    );
    yPos += 7;
  }
  yPos += 5;
  pdf.setFontSize(11);
  pdf.text(translate(locale, "pdf.backingCloth"), margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.text(
    `• ${materials.backingCloth.width.toFixed(1)} × ${materials.backingCloth.height.toFixed(1)} ${getUnitLabel(locale, materials.backingCloth.unit)}`,
    margin + 4,
    yPos
  );
  yPos += 10;
  pdf.setFontSize(11);
  pdf.text(translate(locale, "pdf.secondaryBacking"), margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.text(
    `• ${materials.secondaryBacking.width.toFixed(1)} × ${materials.secondaryBacking.height.toFixed(1)} ${getUnitLabel(locale, materials.secondaryBacking.unit)}`,
    margin + 4,
    yPos
  );
  yPos += 10;
  pdf.setFontSize(11);
  pdf.text(translate(locale, "pdf.glue"), margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.text(`• ${materials.glueMl} ml`, margin + 4, yPos);
  yPos += 10;
  pdf.setFontSize(10);
  pdf.text(
    translate(locale, "pdf.wasteFactor", { p: materials.wasteFactorPercent }),
    margin,
    yPos
  );

  pdf.save(translate(locale, "pdf.filename"));
}
