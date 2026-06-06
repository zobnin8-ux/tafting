"use client";

import { create } from "zustand";
import {
  COLOR_COUNT_DEFAULT,
  DEFAULT_RUG_SETTINGS,
  NOISE_THRESHOLD_DEFAULT,
  WASTE_FACTOR_DEFAULT,
} from "@/constants";
import {
  processImage,
  reprocessFromLabels,
  regenerateOriginalPreview,
} from "@/services/ImageProcessingService";
import { mergeColors } from "@/services/ColorReductionService";
import { getDefaultColorName } from "@/i18n";
import { isValidDataUrl, resolvePreviewUrl } from "@/lib/preview";
import { useLocaleStore } from "@/store/useLocaleStore";
import {
  beginReprocess,
  isLatestReprocess,
  scheduleReprocess,
  flushScheduledReprocess,
} from "@/store/reprocessManager";
import type {
  RugSettings,
  ProcessedImages,
  PaletteColor,
  MaterialList,
  ColorMergeSuggestion,
  ComplexityAnalysis,
  PreviewMode,
  GridSize,
  ProgressKey,
  ErrorKey,
  MergeUndoSnapshot,
} from "@/types";
import type { Rgb } from "@/lib/color";

interface TuftingState {
  originalFile: File | null;
  originalPreviewUrl: string | null;
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
  mergeUndoStack: MergeUndoSnapshot[];

  images: ProcessedImages | null;
  labels: Int32Array | null;
  centroids: Rgb[] | null;
  palette: PaletteColor[];
  materials: MaterialList | null;
  mergeSuggestions: ColorMergeSuggestion[];
  complexity: ComplexityAnalysis | null;

  isProcessing: boolean;
  error: ErrorKey | null;
  progress: ProgressKey | null;

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
  undoLastMerge: () => void;
  dismissMergeSuggestion: (colorAId: string, colorBId: string) => void;
  getActivePreviewUrl: () => string | null;
  recalculate: () => void;
  commitReprocess: () => void;
  repairPreviewUrls: () => Promise<void>;
}

export const useTuftingStore = create<TuftingState>((set, get) => ({
  originalFile: null,
  originalPreviewUrl: null,
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
  mergeUndoStack: [],

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
    if (!get().originalFile || !get().images) return;
    scheduleReprocess(() => get().reprocess());
  },

  setNoiseThreshold: (threshold) => {
    set({ noiseThreshold: threshold });
    if (!get().originalFile || !get().images) return;
    scheduleReprocess(() => get().reprocess());
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

  setPreviewMode: (mode) => {
    set({ previewMode: mode });
    void get().repairPreviewUrls();
  },

  setColorName: (hex, name) => {
    const colorNames = new Map(get().colorNames);
    colorNames.set(hex, name);
    const palette = get().palette.map((c) =>
      c.hex === hex ? { ...c, name } : c
    );
    const materials = get().materials
      ? {
          ...get().materials!,
          yarns: get().materials!.yarns.map((y) =>
            y.hex === hex ? { ...y, name } : y
          ),
        }
      : null;
    set({ colorNames, palette, materials });
  },

  uploadImage: async (file) => {
    set({
      originalFile: file,
      isProcessing: true,
      error: null,
      progress: "processing",
      previewMode: "original",
    });
    try {
      const locale = useLocaleStore.getState().locale;
      const result = await processImage(
        file,
        get().colorCount,
        get().noiseThreshold,
        get().rugSettings,
        get().wasteFactorPercent,
        get().colorNames,
        get().showGrid,
        get().gridSize,
        (i) => getDefaultColorName(locale, i)
      );
      set({
        originalPreviewUrl: result.images.originalDataUrl,
        images: result.images,
        labels: result.labels,
        centroids: result.centroids,
        palette: result.palette,
        materials: result.materials,
        mergeSuggestions: result.mergeSuggestions,
        complexity: result.complexity,
        previewMode: "reduced",
        mergeUndoStack: [],
        isProcessing: false,
        progress: null,
      });
    } catch (err) {
      set({
        error: "processingFailed",
        isProcessing: false,
        progress: null,
      });
    }
  },

  reprocess: async () => {
    const state = get();
    if (!state.originalFile || !state.images) return;

    const generation = beginReprocess();
    set({ isProcessing: true, error: null, progress: "reprocessing" });

    try {
      const locale = useLocaleStore.getState().locale;
      const result = await processImage(
        state.originalFile,
        state.colorCount,
        state.noiseThreshold,
        state.rugSettings,
        state.wasteFactorPercent,
        state.colorNames,
        state.showGrid,
        state.gridSize,
        (i) => getDefaultColorName(locale, i)
      );

      if (!isLatestReprocess(generation)) return;

      set({
        originalPreviewUrl: result.images.originalDataUrl,
        images: result.images,
        labels: result.labels,
        centroids: result.centroids,
        palette: result.palette,
        materials: result.materials,
        mergeSuggestions: result.mergeSuggestions,
        complexity: result.complexity,
        mergeUndoStack: [],
        isProcessing: false,
        progress: null,
      });
    } catch {
      if (!isLatestReprocess(generation)) return;
      set({
        error: "reprocessingFailed",
        isProcessing: false,
        progress: null,
      });
    }
  },

  commitReprocess: () => {
    if (!get().originalFile || !get().images) return;
    flushScheduledReprocess(() => get().reprocess());
  },

  recalculate: () => {
    const { labels, centroids, images, rugSettings, wasteFactorPercent, colorNames, showGrid, gridSize } = get();
    if (!labels || !centroids || !images) return;

    const locale = useLocaleStore.getState().locale;
    const result = reprocessFromLabels(
      labels,
      centroids,
      images.width,
      images.height,
      rugSettings,
      wasteFactorPercent,
      colorNames,
      showGrid,
      gridSize,
      (i) => getDefaultColorName(locale, i)
    );

    const original =
      get().originalPreviewUrl && isValidDataUrl(get().originalPreviewUrl)
        ? get().originalPreviewUrl!
        : isValidDataUrl(images.originalDataUrl)
          ? images.originalDataUrl
          : "";

    set({
      images: {
        ...result.images,
        originalDataUrl: original,
      },
      palette: result.palette,
      materials: result.materials,
      mergeSuggestions: result.mergeSuggestions,
      complexity: result.complexity,
    });
  },

  repairPreviewUrls: async () => {
    const { images, originalFile, originalPreviewUrl, previewMode, showMirrored } =
      get();
    if (!images) return;

    const currentUrl = resolvePreviewUrl(
      images,
      previewMode,
      originalPreviewUrl,
      showMirrored
    );
    if (isValidDataUrl(currentUrl)) return;

    const needsOriginal =
      previewMode === "original" &&
      !isValidDataUrl(originalPreviewUrl) &&
      !isValidDataUrl(images.originalDataUrl);

    if (needsOriginal && originalFile) {
      try {
        const url = await regenerateOriginalPreview(originalFile);
        set({
          originalPreviewUrl: url,
          images: { ...images, originalDataUrl: url },
        });
        return;
      } catch {
        // fall through to full recalculate
      }
    }

    if (get().labels && get().centroids) {
      get().recalculate();
    }
  },

  mergePaletteColors: async (colorAId, colorBId) => {
    const { labels, centroids, images, palette } = get();
    if (!labels || !centroids || !images) return;

    const idxA = palette.findIndex((c) => c.id === colorAId);
    const idxB = palette.findIndex((c) => c.id === colorBId);
    if (idxA < 0 || idxB < 0) return;

    const snapshot: MergeUndoSnapshot = {
      labels: new Int32Array(labels),
      centroids: centroids.map((c) => ({ ...c })),
      colorCount: get().colorCount,
      colorNames: new Map(get().colorNames),
    };

    const { labels: newLabels, centroids: newCentroids } = mergeColors(
      labels,
      centroids,
      idxB,
      idxA,
      images.width,
      images.height
    );

    set({
      labels: newLabels,
      centroids: newCentroids,
      colorCount: newCentroids.length,
      mergeUndoStack: [...get().mergeUndoStack, snapshot],
    });
    get().recalculate();
  },

  undoLastMerge: () => {
    const stack = get().mergeUndoStack;
    if (stack.length === 0) return;

    const snapshot = stack[stack.length - 1];
    set({
      labels: new Int32Array(snapshot.labels),
      centroids: snapshot.centroids.map((c) => ({ ...c })),
      colorCount: snapshot.colorCount,
      colorNames: new Map(snapshot.colorNames),
      mergeUndoStack: stack.slice(0, -1),
    });
    get().recalculate();
  },

  dismissMergeSuggestion: (colorAId, colorBId) => {
    const dismissedMerges = new Set(get().dismissedMerges);
    dismissedMerges.add(`${colorAId}-${colorBId}`);
    dismissedMerges.add(`${colorBId}-${colorAId}`);
    set({ dismissedMerges });
  },

  getActivePreviewUrl: () => {
    const { images, previewMode, showMirrored, originalPreviewUrl } = get();
    if (!images) return null;
    return resolvePreviewUrl(
      images,
      previewMode,
      originalPreviewUrl,
      showMirrored
    );
  },
}));
