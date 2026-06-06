import dmcColors from "@/data/dmc-colors.json";
import tuftTheWorldColors from "@/data/tuft-the-world-wool.json";
import { colorDistance } from "@/lib/color";
import type { Rgb } from "@/lib/color";
import type { PaletteColor, YarnCatalogId, YarnColorMatch } from "@/types";

export interface CatalogColor {
  id: string;
  name: string;
  r: number;
  g: number;
  b: number;
  hex: string;
  brand?: string;
  product?: string;
  note?: string;
}

const CATALOGS: Record<YarnCatalogId, CatalogColor[]> = {
  dmc: dmcColors as CatalogColor[],
  "tuft-the-world": tuftTheWorldColors as CatalogColor[],
};

export interface YarnMatchPreferences {
  dmc: boolean;
  tuftTheWorld: boolean;
}

export function findClosestCatalogColor(
  rgb: Rgb,
  catalog: CatalogColor[]
): { color: CatalogColor; distance: number } {
  let best = catalog[0];
  let bestDistance = Infinity;

  for (const color of catalog) {
    const distance = colorDistance(rgb, color);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }

  return { color: best, distance: bestDistance };
}

function toMatch(
  catalogId: YarnCatalogId,
  color: CatalogColor,
  distance: number
): YarnColorMatch {
  return {
    catalogId,
    colorId: color.id,
    name: color.name,
    hex: color.hex,
    distance: Math.round(distance * 10) / 10,
    approximate: catalogId === "tuft-the-world",
  };
}

export function matchColorToCatalogs(
  rgb: Rgb,
  prefs: YarnMatchPreferences
): YarnColorMatch[] {
  const matches: YarnColorMatch[] = [];

  if (prefs.dmc) {
    const { color, distance } = findClosestCatalogColor(rgb, CATALOGS.dmc);
    matches.push(toMatch("dmc", color, distance));
  }

  if (prefs.tuftTheWorld) {
    const { color, distance } = findClosestCatalogColor(
      rgb,
      CATALOGS["tuft-the-world"]
    );
    matches.push(toMatch("tuft-the-world", color, distance));
  }

  return matches;
}

export function attachYarnMatches(
  palette: PaletteColor[],
  prefs: YarnMatchPreferences
): PaletteColor[] {
  if (!prefs.dmc && !prefs.tuftTheWorld) {
    return palette.map((color) => ({ ...color, yarnMatches: [] }));
  }

  return palette.map((color) => ({
    ...color,
    yarnMatches: matchColorToCatalogs(color.rgb, prefs),
  }));
}

export function formatYarnMatchLabel(match: YarnColorMatch): string {
  if (match.catalogId === "dmc") {
    return `DMC ${match.colorId}`;
  }
  return match.name;
}
