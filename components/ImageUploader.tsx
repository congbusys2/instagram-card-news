"use client";

import { useCallback, useId, useState } from "react";
import { Upload } from "lucide-react";

type ImageUploaderProps = {
  onFilesSelected: (files: File[]) => void;
};

/** 일부 기기(iOS 등)에서 MIME이 비어 있어도 이미지로 인식 */
export function isLikelyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  if (!f.type || f.type === "application/octet-stream") {
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|svg)$/i.test(f.name);
  }
  return false;
}

export function ImageUploader({ onFilesSelected }: ImageUploaderProps) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);

  const pickImages = useCallback(
    (list: FileList | File[]) => {
      const files = Array.from(list).filter(isLikelyImageFile);
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  return (
    <section className="mt-8" aria-label="이미지 업로드">
      <div
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed px-6 py-8 shadow-[0_0_0_1px_rgba(39,39,42,0.3)] transition-colors sm:min-h-[220px] ${
          dragOver
            ? "border-violet-500/80 bg-zinc-900/80 shadow-lg shadow-violet-950/20"
            : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-600"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (e.dataTransfer.files?.length) pickImages(e.dataTransfer.files);
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          aria-label="이미지 파일 선택"
          className="absolute inset-0 z-20 h-full min-h-[200px] w-full cursor-pointer opacity-0 sm:min-h-[220px]"
          onChange={(e) => {
            if (e.target.files?.length) pickImages(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          className="pointer-events-none relative z-10 flex flex-col items-center justify-center px-2"
          aria-hidden
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800">
            <Upload className="h-6 w-6" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="text-center text-base font-medium text-zinc-200 sm:text-lg">
            이미지를 드래그하거나 클릭하여 업로드
          </span>
          <span className="mt-2 text-center text-sm text-zinc-500">
            여러 장 업로드 가능 · 아래에서 카드에 쓸 이미지를 선택하세요
          </span>
        </div>
      </div>
    </section>
  );
}
