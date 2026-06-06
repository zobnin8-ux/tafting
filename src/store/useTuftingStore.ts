"use client";

import { create } from "zustand";
import {
  COLOR_COUNT_DEFAULT,
  DEFAULT_ARTWORK_PREP,
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
import { attachYarnMatches } from "@/services/YarnMatchService";
import { getDefaultColorName } from "@/i18n";
import { isValidDataUrl, resolvePreviewUrl } from "@/lib/preview";
import { useLocaleStore } from "@/store/useLocaleStore";
import {
  beginReprocess,
  isLatestReprocess,
  scheduleReprocess,
  flushScheduledReprocess,
  cancelScheduledReprocess,
} from "@/store/reprocessManager";
import type {
  RugSettings,
  ProcessedImages,
  PaletteColor,
  MaterialList,
  ColorMergeSuggestion,
  ComplexityAnalysis,
  PreviewMode,
  ColorMapLabelMode,
  GridSize,
  ProgressKey,
  ErrorKey,
  MergeUndoSnapshot,
  ArtworkPrepSettings,
  PrepWarning,
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
  colorMapLabelMode: ColorMapLabelMode;
  matchDmc: boolean;
  matchTuftTheWorld: boolean;
  previewMode: PreviewMode;
  colorNames: Map<string, string>;
  dismissedMerges: Set<string>;
  mergeUndoStack: MergeUndoSnapshot[];
  artworkPrepSettings: ArtworkPrepSettings;
  prepUndoStack: ArtworkPrepSettings[];
  lastCommittedPrep: ArtworkPrepSettings;
  prepWarnings: PrepWarning[];

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
  setColorMapLabelMode: (mode: ColorMapLabelMode) => void;
  setMatchDmc: (match: boolean) => void;
  setMatchTuftTheWorld: (match: boolean) => void;
  patchArtworkPrepSettings: (settings: Partial<ArtworkPrepSettings>) => void;
  commitArtworkPrepChange: () => void;
  undoPrepSettings: () => void;
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

function withYarnMatches(
  palette: PaletteColor[],
  matchDmc: boolean,
  matchTuftTheWorld: boolean
): PaletteColor[] {
  return attachYarnMatches(palette, {
    dmc: matchDmc,
    tuftTheWorld: matchTuftTheWorld,
  });
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
  colorMapLabelMode: "numbers",
  matchDmc: true,
  matchTuftTheWorld: true,
  previewMode: "reduced",
  colorNames: new Map(),
  dismissedMerges: new Set(),
  mergeUndoStack: [],
  artworkPrepSettings: { ...DEFAULT_ARTWORK_PREP },
  prepUndoStack: [],
  lastCommittedPrep: { ...DEFAULT_ARTWORK_PREP },
  prepWarnings: [],

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

  setColorMapLabelMode: (mode) => set({ colorMapLabelMode: mode }),

  setMatchDmc: (matchDmc) => {
    set({
      matchDmc,
      palette: withYarnMatches(
        get().palette,
        matchDmc,
        get().matchTuftTheWorld
      ),
    });
  },

  setMatchTuftTheWorld: (matchTuftTheWorld) => {
    set({
      matchTuftTheWorld,
      palette: withYarnMatches(get().palette, get().matchDmc, matchTuftTheWorld),
    });
  },

  patchArtworkPrepSettings: (partial) => {
    set({
      artworkPrepSettings: { ...get().artworkPrepSettings, ...partial },
    });
  },

  commitArtworkPrepChange: () => {
    const current = get().artworkPrepSettings;
    const last = get().lastCommittedPrep;
    const unchanged =
      last.removeBackground === current.removeBackground &&
      last.backgroundTolerance === current.backgroundTolerance &&
      last.simplification === current.simplification &&
      last.smallRegionPercent === current.smallRegionPercent &&
      last.minLineWidth === current.minLineWidth &&
      last.thickenThinLines === current.thickenThinLines;
    if (unchanged) return;

    set({
      prepUndoStack: [...get().prepUndoStack, last].slice(-12),
      lastCommittedPrep: { ...current },
    });
    if (!get().originalFile || !get().images) return;
    scheduleReprocess(() => get().reprocess());
  },

  undoPrepSettings: () => {
    const stack = get().prepUndoStack;
    if (stack.length === 0) return;
    const previous = stack[stack.length - 1];
    set({
      artworkPrepSettings: { ...previous },
      lastCommittedPrep: { ...previous },
      prepUndoStack: stack.slice(0, -1),
    });
    if (!get().originalFile || !get().images) return;
    scheduleReprocess(() => get().reprocess());
  },

  setPreviewMode: (mode) => set({ previewMode: mode }),

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
    cancelScheduledReprocess();
    set({
      originalFile: file,
      images: null,
      labels: null,
      centroids: null,
      palette: [],
      materials: null,
      mergeSuggestions: [],
      complexity: null,
      prepWarnings: [],
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
        (i) => getDefaultColorName(locale, i),
        get().artworkPrepSettings
      );
      set({
        originalPreviewUrl: result.images.originalDataUrl,
        images: result.images,
        labels: result.labels,
        centroids: result.centroids,
        palette: withYarnMatches(
          result.palette,
          get().matchDmc,
          get().matchTuftTheWorld
        ),
        materials: result.materials,
        mergeSuggestions: result.mergeSuggestions,
        complexity: result.complexity,
        prepWarnings: result.prepWarnings,
        previewMode: "cleaned",
        mergeUndoStack: [],
        prepUndoStack: [],
        lastCommittedPrep: { ...get().artworkPrepSettings },
        isProcessing: false,
        progress: null,
        error: null,
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
    if (!state.originalFile || !state.images || state.isProcessing) return;

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
        (i) => getDefaultColorName(locale, i),
        state.artworkPrepSettings
      );

      if (!isLatestReprocess(generation)) return;

      set({
        originalPreviewUrl: result.images.originalDataUrl,
        images: result.images,
        labels: result.labels,
        centroids: result.centroids,
        palette: withYarnMatches(
          result.palette,
          get().matchDmc,
          get().matchTuftTheWorld
        ),
        materials: result.materials,
        mergeSuggestions: result.mergeSuggestions,
        complexity: result.complexity,
        prepWarnings: result.prepWarnings,
        mergeUndoStack: [],
        isProcessing: false,
        progress: null,
        error: null,
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
    const {
      labels,
      centroids,
      images,
      rugSettings,
      wasteFactorPercent,
      colorNames,
      showGrid,
      gridSize,
      noiseThreshold,
    } = get();
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
      (i) => getDefaultColorName(locale, i),
      noiseThreshold
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
        preparedDataUrl: images.preparedDataUrl,
      },
      palette: withYarnMatches(
        result.palette,
        get().matchDmc,
        get().matchTuftTheWorld
      ),
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
