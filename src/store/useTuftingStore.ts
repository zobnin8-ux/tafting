"use client";

import { create } from "zustand";
import {
  COLOR_COUNT_DEFAULT,
  DEFAULT_RUG_SETTINGS,
  NOISE_THRESHOLD_DEFAULT,
  WASTE_FACTOR_DEFAULT,
} from "@/constants";
import { processImage, reprocessFromLabels } from "@/services/ImageProcessingService";
import { mergeColors } from "@/services/ColorReductionService";
import type {
  RugSettings,
  ProcessedImages,
  PaletteColor,
  MaterialList,
  ColorMergeSuggestion,
  ComplexityAnalysis,
  PreviewMode,
  GridSize,
} from "@/types";
import type { Rgb } from "@/lib/color";

interface TuftingState {
  originalFile: File | null;
  colorCount: number;
  noiseThreshold: number;
  wasteFactorPercent: number;
  rugSettings: RugSettings;
  showContours: boolean;
  showMirrored: boolean;
  showGrid: boolean;
  gridSize: GridSize;
  previewMode: PreviewMode;
  colorNames: Map<string, string>;
  dismissedMerges: Set<string>;

  images: ProcessedImages | null;
  labels: Int32Array | null;
  centroids: Rgb[] | null;
  palette: PaletteColor[];
  materials: MaterialList | null;
  mergeSuggestions: ColorMergeSuggestion[];
  complexity: ComplexityAnalysis | null;

  isProcessing: boolean;
  error: string | null;
  progress: string | null;

  setColorCount: (count: number) => void;
  setNoiseThreshold: (threshold: number) => void;
  setWasteFactorPercent: (percent: number) => void;
  setRugSettings: (settings: Partial<RugSettings>) => void;
  setShowContours: (show: boolean) => void;
  setShowMirrored: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: GridSize) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setColorName: (hex: string, name: string) => void;
  uploadImage: (file: File) => Promise<void>;
  reprocess: () => Promise<void>;
  mergePaletteColors: (colorAId: string, colorBId: string) => Promise<void>;
  dismissMergeSuggestion: (colorAId: string, colorBId: string) => void;
  getActivePreviewUrl: () => string | null;
  recalculate: () => void;
}

export const useTuftingStore = create<TuftingState>((set, get) => ({
  originalFile: null,
  colorCount: COLOR_COUNT_DEFAULT,
  noiseThreshold: NOISE_THRESHOLD_DEFAULT,
  wasteFactorPercent: WASTE_FACTOR_DEFAULT,
  rugSettings: { ...DEFAULT_RUG_SETTINGS },
  showContours: false,
  showMirrored: false,
  showGrid: false,
  gridSize: "1in",
  previewMode: "reduced",
  colorNames: new Map(),
  dismissedMerges: new Set(),

  images: null,
  labels: null,
  centroids: null,
  palette: [],
  materials: null,
  mergeSuggestions: [],
  complexity: null,

  isProcessing: false,
  error: null,
  progress: null,

  setColorCount: (count) => {
    set({ colorCount: count });
    get().reprocess();
  },

  setNoiseThreshold: (threshold) => {
    set({ noiseThreshold: threshold });
    get().reprocess();
  },

  setWasteFactorPercent: (percent) => {
    set({ wasteFactorPercent: percent });
    get().recalculate();
  },

  setRugSettings: (settings) => {
    set({ rugSettings: { ...get().rugSettings, ...settings } });
    get().recalculate();
  },

  setShowContours: (show) => {
    set({ showContours: show, previewMode: show ? "contour" : "reduced" });
  },

  setShowMirrored: (show) => {
    set({ showMirrored: show });
    if (show) set({ previewMode: "mirrored" });
  },

  setShowGrid: (show) => {
    set({ showGrid: show });
    get().recalculate();
  },

  setGridSize: (size) => {
    set({ gridSize: size });
    get().recalculate();
  },

  setPreviewMode: (mode) => set({ previewMode: mode }),

  setColorName: (hex, name) => {
    const colorNames = new Map(get().colorNames);
    colorNames.set(hex, name);
    set({ colorNames });
    get().recalculate();
  },

  uploadImage: async (file) => {
    set({
      originalFile: file,
      isProcessing: true,
      error: null,
      progress: "Processing image...",
      previewMode: "original",
    });
    try {
      const result = await processImage(
        file,
        get().colorCount,
        get().noiseThreshold,
        get().rugSettings,
        get().wasteFactorPercent,
        get().colorNames,
        get().showGrid,
        get().gridSize
      );
      set({
        images: result.images,
        labels: result.labels,
        centroids: result.centroids,
        palette: result.palette,
        materials: result.materials,
        mergeSuggestions: result.mergeSuggestions,
        complexity: result.complexity,
        previewMode: "reduced",
        isProcessing: false,
        progress: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Processing failed",
        isProcessing: false,
        progress: null,
      });
    }
  },

  reprocess: async () => {
    const { originalFile } = get();
    if (!originalFile) return;
    set({ isProcessing: true, error: null, progress: "Reprocessing..." });
    try {
      const result = await processImage(
        originalFile,
        get().colorCount,
        get().noiseThreshold,
        get().rugSettings,
        get().wasteFactorPercent,
        get().colorNames,
        get().showGrid,
        get().gridSize
      );
      set({
        images: {
          ...result.images,
          originalDataUrl: get().images?.originalDataUrl ?? result.images.originalDataUrl,
        },
        labels: result.labels,
        centroids: result.centroids,
        palette: result.palette,
        materials: result.materials,
        mergeSuggestions: result.mergeSuggestions,
        complexity: result.complexity,
        isProcessing: false,
        progress: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Reprocessing failed",
        isProcessing: false,
        progress: null,
      });
    }
  },

  recalculate: () => {
    const { labels, centroids, images, rugSettings, wasteFactorPercent, colorNames, showGrid, gridSize } = get();
    if (!labels || !centroids || !images) return;

    const result = reprocessFromLabels(
      labels,
      centroids,
      images.width,
      images.height,
      rugSettings,
      wasteFactorPercent,
      colorNames,
      showGrid,
      gridSize
    );

    set({
      images: { ...images, ...result.images },
      palette: result.palette,
      materials: result.materials,
      mergeSuggestions: result.mergeSuggestions,
      complexity: result.complexity,
    });
  },

  mergePaletteColors: async (colorAId, colorBId) => {
    const { labels, centroids, images, palette } = get();
    if (!labels || !centroids || !images) return;

    const idxA = palette.findIndex((c) => c.id === colorAId);
    const idxB = palette.findIndex((c) => c.id === colorBId);
    if (idxA < 0 || idxB < 0) return;

    const { labels: newLabels, centroids: newCentroids } = mergeColors(
      labels,
      centroids,
      idxB,
      idxA,
      images.width,
      images.height
    );

    set({ labels: newLabels, centroids: newCentroids, colorCount: newCentroids.length });
    get().recalculate();
  },

  dismissMergeSuggestion: (colorAId, colorBId) => {
    const dismissedMerges = new Set(get().dismissedMerges);
    dismissedMerges.add(`${colorAId}-${colorBId}`);
    dismissedMerges.add(`${colorBId}-${colorAId}`);
    set({ dismissedMerges });
  },

  getActivePreviewUrl: () => {
    const { images, previewMode, showContours, showMirrored } = get();
    if (!images) return null;
    if (showMirrored || previewMode === "mirrored") return images.mirroredDataUrl;
    if (showContours || previewMode === "contour") return images.contourDataUrl;
    if (previewMode === "original") return images.originalDataUrl;
    return images.reducedDataUrl;
  },
}));
