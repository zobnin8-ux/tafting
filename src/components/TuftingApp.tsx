"use client";

import { ImageUploader } from "./ImageUploader";
import { PreparationPanel } from "./PreparationPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PatternPreview } from "./PatternPreview";
import { PalettePanel } from "./PalettePanel";
import { MaterialEstimator } from "./MaterialEstimator";
import { ExportManager } from "./ExportManager";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";

export function TuftingApp() {
  const error = useTuftingStore((s) => s.error);
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-stone-100">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">
              {t("app.title")}
            </h1>
            <p className="text-sm text-stone-500">{t("app.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {error && (
        <div className="bg-red-50 px-6 py-2 text-center text-sm text-red-700">
          {t(`errors.${error}`)}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 items-start gap-4 p-4 lg:p-6">
        <aside className="w-full shrink-0 space-y-5 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7.5rem)] lg:w-72 xl:w-80">
          <ImageUploader />
          <hr className="border-stone-200" />
          <PreparationPanel />
          <hr className="border-stone-200" />
          <SettingsPanel />
          <hr className="border-stone-200" />
          <ExportManager />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col self-start rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-4">
          <PatternPreview />
        </section>

        <aside className="w-full shrink-0 space-y-5 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7.5rem)] lg:w-72 xl:w-80">
          <PalettePanel />
          <hr className="border-stone-200" />
          <MaterialEstimator />
        </aside>
      </main>
    </div>
  );
}
