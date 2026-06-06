"use client";

import { useCallback, useRef, useState } from "react";
import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import { isAcceptedImageFile } from "@/lib/imageUpload";

export function ImageUploader() {
  const uploadImage = useTuftingStore((s) => s.uploadImage);
  const isProcessing = useTuftingStore((s) => s.isProcessing);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isAcceptedImageFile(file)) {
        alert(t("upload.invalidFormat"));
        return;
      }
      uploadImage(file);
    },
    [uploadImage, t]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
        {t("upload.title")}
      </h3>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-amber-500 bg-amber-50"
            : "border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/50"
        } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="text-stone-500">
          <svg
            className="mx-auto mb-2 h-8 w-8 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium">{t("upload.dragDrop")}</p>
          <p className="mt-1 text-xs text-stone-400">{t("upload.formats")}</p>
        </div>
      </div>
    </div>
  );
}
