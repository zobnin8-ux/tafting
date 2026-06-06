"use client";

import { useCallback, useRef } from "react";
import { useTuftingStore } from "@/store/useTuftingStore";
import { useTranslation } from "@/hooks/useTranslation";
import { isAcceptedImageFile } from "@/lib/imageUpload";

interface HeaderUploadButtonProps {
  className?: string;
}

export function HeaderUploadButton({ className = "" }: HeaderUploadButtonProps) {
  const uploadImage = useTuftingStore((s) => s.uploadImage);
  const isProcessing = useTuftingStore((s) => s.isProcessing);
  const { t } = useTranslation();
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

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className={`shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50 ${className}`}
      >
        {t("upload.button")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
