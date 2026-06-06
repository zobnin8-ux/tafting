import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const DMC_URL =
  "https://raw.githubusercontent.com/kohsuke/dmc-cross-stitch/master/src/main/resources/dmc-floss.csv";

const TUFT_THE_WORLD_COLORS = {
  Aloe: "#B8D4B8",
  Apricot: "#FBCEB1",
  Black: "#1A1A1A",
  Blush: "#FFB6C1",
  Brick: "#CB4154",
  Burgundy: "#800020",
  "Burnt Orange": "#CC5500",
  Camo: "#78866B",
  Canary: "#FFEF00",
  Chocolate: "#7B3F00",
  Clay: "#B66A50",
  Cocoa: "#8B5A2B",
  Crimson: "#DC143C",
  Denim: "#1560BD",
  Driftwood: "#AF8751",
  "Dusty Rose": "#DCAE96",
  Ecru: "#F0EAD6",
  Eucalyptus: "#5F9E8F",
  Fuchsia: "#FF00FF",
  "Golden Cypress": "#8A7B4F",
  Green: "#228B22",
  Grey: "#808080",
  "Grotto Blue": "#1E4D6B",
  Honey: "#EB9605",
  Iris: "#5A4FCF",
  Juniper: "#3A4F41",
  Lavender: "#E6E6FA",
  Linen: "#FAF0E6",
  Marigold: "#EAA221",
  Marmalade: "#FF8C00",
  Mint: "#98FF98",
  Mist: "#B8C4C8",
  "Moss blue": "#598556",
  Mulberry: "#C54B8C",
  "Neon Orange": "#FF6600",
  "Neon Pink": "#FF10F0",
  "Neon Yellow": "#FFFF00",
  Oat: "#D4C4A8",
  Ochre: "#CC7722",
  Orange: "#FFA500",
  "Pale Blue": "#AFEEEE",
  Persimmon: "#EC5800",
  Pine: "#01796F",
  Purple: "#800080",
  Red: "#E32636",
  "Red Earth": "#8B4513",
  Royal: "#4169E1",
  Rust: "#B7410E",
  Sage: "#9DC183",
  Salmon: "#FA8072",
  Sand: "#C2B280",
  Sky: "#87CEEB",
  Tangerine: "#F28500",
  Taupe: "#483C32",
  "Teal Blue": "#008080",
  Terracotta: "#E2725B",
  Winterberry: "#8B1538",
  Wisteria: "#C9A0DC",
  "Green Banana": "#ADFF2F",
};

function hexToRgb(hex) {
  const num = parseInt(hex.replace("#", ""), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

async function buildDmc() {
  const res = await fetch(DMC_URL);
  const csv = await res.text();
  const lines = csv.trim().split(/\r?\n/).slice(1);
  const colors = [];

  for (const line of lines) {
    const match = line.match(/^"?([^",]+)"?,"([^"]+)",(\d+),(\d+),(\d+)/);
    if (!match) continue;
    const [, id, name, rs, gs, bs] = match;
    const r = Number(rs);
    const g = Number(gs);
    const b = Number(bs);
    const hex =
      "#" +
      [r, g, b]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    colors.push({ id, name, r, g, b, hex });
  }

  return colors;
}

function buildTuftTheWorld() {
  return Object.entries(TUFT_THE_WORLD_COLORS).map(([name, hex]) => {
    const { r, g, b } = hexToRgb(hex);
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      r,
      g,
      b,
      hex: hex.toUpperCase(),
      brand: "tuft-the-world",
      product: "Reflect Wool Yarn",
      note: "approximate",
    };
  });
}

const dataDir = path.join(root, "src", "data");
fs.mkdirSync(dataDir, { recursive: true });

const dmc = await buildDmc();
const ttw = buildTuftTheWorld();

fs.writeFileSync(path.join(dataDir, "dmc-colors.json"), JSON.stringify(dmc));
fs.writeFileSync(
  path.join(dataDir, "tuft-the-world-wool.json"),
  JSON.stringify(ttw)
);

console.log(`Wrote ${dmc.length} DMC colors and ${ttw.length} Tuft the World colors`);
