"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUploader } from "./ImageUploader";
import { PreparationPanel } from "./PreparationPanel";
import { SettingsPanel, RugDimensionsSection } from "./SettingsPanel";
import { PatternPreview } from "./PatternPreview";
import { PalettePanel } from "./PalettePanel";
import { MaterialEstimator } from "./MaterialEstimator";
import { ExportManager } from "./ExportManager";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AccordionSection } from "./AccordionSection";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { HeaderUploadButton } from "./HeaderUploadButton";
import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";

function panelVisibility(
  tab: MobileTab,
  target: MobileTab,
  display: "block" | "flex" = "block"
): string {
  const active = display === "flex" ? "flex flex-col" : "block";
  const inactive = display === "flex" ? "hidden lg:flex lg:flex-col" : "hidden lg:block";
  return tab === target ? active : inactive;
}

export function TuftingApp() {
  const error = useTuftingStore((s) => s.error);
  const images = useTuftingStore((s) => s.images);
  const { t } = useTranslation();
  const [mobileTab, setMobileTab] = useState<MobileTab>("settings");
  const hadImages = useRef(false);

  useEffect(() => {
    if (images && !hadImages.current) {
      setMobileTab("preview");
    }
    hadImages.current = images !== null;
  }, [images]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-100">
      <header className="border-b border-stone-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-3 sm:items-center sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-stone-900 sm:text-xl">
              {t("app.title")}
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">{t("app.subtitle")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {images && <HeaderUploadButton className="lg:hidden" />}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 px-4 py-2 text-center text-sm text-red-700 sm:px-6">
          {t(`errors.${error}`)}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col items-stretch gap-4 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:flex-row lg:items-start lg:p-6 lg:pb-6">
        <aside
          className={`${panelVisibility(mobileTab, "settings")} w-full shrink-0 space-y-4 rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7.5rem)] lg:w-72 lg:overflow-y-auto xl:w-80`}
        >
          <ImageUploader />
          <hr className="border-stone-200" />
          <AccordionSection title={t("prep.title")} defaultOpen>
            <PreparationPanel embedded />
          </AccordionSection>
          <AccordionSection title={t("settings.rugDimensions")}>
            <RugDimensionsSection embedded />
          </AccordionSection>
          <SettingsPanel showDimensions={false} />
          <hr className="border-stone-200" />
          <AccordionSection title={t("export.title")}>
            <ExportManager embedded />
          </AccordionSection>
        </aside>

        <section
          className={`${panelVisibility(mobileTab, "preview", "flex")} min-w-0 flex-1 self-stretch rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-4 lg:self-start`}
        >
          <PatternPreview />
        </section>

        <aside
          className={`${panelVisibility(mobileTab, "palette")} w-full shrink-0 space-y-5 rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7.5rem)] lg:w-72 lg:overflow-y-auto xl:w-80`}
        >
          <PalettePanel />
          <hr className="border-stone-200" />
          <MaterialEstimator />
        </aside>
      </main>

      <MobileBottomNav active={mobileTab} onChange={setMobileTab} />
    </div>
  );
}
