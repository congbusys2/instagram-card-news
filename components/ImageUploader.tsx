"use client";

import { useCallback, useId, useState } from "react";
import { Upload } from "lucide-react";

type ImageUploaderProps = {
  onFilesSelected: (files: File[]) => void;
};

export function ImageUploader({ onFilesSelected }: ImageUploaderProps) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);

  const pickImages = useCallback(
    (list: FileList | File[]) => {
      const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  return (
    <section className="mt-8" aria-label="이미지 업로드">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) pickImages(e.dataTransfer.files);
        }}
        className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 shadow-[0_0_0_1px_rgba(39,39,42,0.3)] transition-colors sm:min-h-[220px] ${
          dragOver
            ? "border-violet-500/80 bg-zinc-900/80 shadow-lg shadow-violet-950/20"
            : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-600"
        }`}
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
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) pickImages(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </section>
  );
}
