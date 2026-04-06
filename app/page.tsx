"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import JSZip from "jszip";
import { CanvasEditor } from "@/components/CanvasEditor";
import { Controls } from "@/components/Controls";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { LimitNoticeModal } from "@/components/LimitNoticeModal";

type CardItem = {
  id: string;
  url: string;
  file: File;
  title: string;
  body: string;
  textOffsetX: number;
  textOffsetY: number;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const itemsRef = useRef<CardItem[]>([]);
  const canvasByIdRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [category, setCategory] = useState("design");
  const [language, setLanguage] = useState("ko");
  const [keyword, setKeyword] = useState("");

  const [items, setItems] = useState<CardItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);

  itemsRef.current = items;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setActiveId(null);
      return;
    }
    if (activeId && !items.some((i) => i.id === activeId)) {
      setActiveId(items[items.length - 1].id);
    }
  }, [items, activeId]);

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  const updateItem = useCallback((id: string, patch: Partial<CardItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }, []);

  const onFilesSelected = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const additions: CardItem[] = imageFiles.map((file) => ({
      id: makeId(),
      url: URL.createObjectURL(file),
      file,
      title: "",
      body: "",
      textOffsetX: 0,
      textOffsetY: 0,
    }));

    setItems((prev) => [...prev, ...additions]);
    setActiveId(additions[additions.length - 1].id);
    setError(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
    canvasByIdRef.current.delete(id);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const openGenerateModal = useCallback(() => {
    if (!keyword.trim()) {
      setError("키워드를 입력한 뒤 생성해 주세요.");
      return;
    }
    setError(null);
    setLimitModalOpen(true);
  }, [keyword]);

  const handleDownloadPng = useCallback(() => {
    if (!activeItem) return;
    const canvas = canvasByIdRef.current.get(activeItem.id);
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "instagram-card-news.png";
    a.click();
  }, [activeItem]);

  const handleSelectedDownloadZip = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setZipBusy(true);
    try {
      const zip = new JSZip();
      let index = 0;
      for (const id of selectedIds) {
        const canvas = canvasByIdRef.current.get(id);
        if (!canvas) continue;
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1];
        if (!base64) continue;
        index += 1;
        zip.file(`card-${String(index).padStart(2, "0")}.png`, base64, {
          base64: true,
        });
      }
      if (index === 0) {
        setError("선택한 카드의 미리보기를 불러올 수 없습니다.");
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "instagram-cards.zip";
      a.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch {
      setError("ZIP 파일을 만드는 중 오류가 났습니다.");
    } finally {
      setZipBusy(false);
    }
  }, [selectedIds]);

  const registerCanvas = useCallback((id: string) => {
    return (node: HTMLCanvasElement | null) => {
      if (node) canvasByIdRef.current.set(id, node);
      else canvasByIdRef.current.delete(id);
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <LimitNoticeModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
      />
      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <Header />

        <Controls
          category={category}
          language={language}
          keyword={keyword}
          onCategoryChange={setCategory}
          onLanguageChange={setLanguage}
          onKeywordChange={setKeyword}
          generateButton={
            <button
              type="button"
              onClick={openGenerateModal}
              disabled={!keyword.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              생성하기
            </button>
          }
        />

        <ImageUploader onFilesSelected={onFilesSelected} />

        {items.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <p className="text-center text-sm text-zinc-500">
                카드 미리보기 · 체크 후 일괄 다운로드
              </p>
              <button
                type="button"
                disabled={selectedIds.length === 0 || zipBusy}
                onClick={() => void handleSelectedDownloadZip()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" aria-hidden />
                {zipBusy ? "ZIP 생성 중…" : "선택 다운로드 (ZIP)"}
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="presentation"
                  onClick={() => setActiveId(item.id)}
                  className={`relative origin-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl transition duration-300 transform hover:scale-105 ${
                    activeId === item.id ? "ring-2 ring-violet-500" : ""
                  }`}
                >
                  <div className="relative z-20 mb-3 flex items-center justify-between gap-2">
                    <label
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-600/80 bg-zinc-950/85 px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-sm backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900/90"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 accent-violet-500"
                      />
                      <span>선택</span>
                    </label>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-zinc-600/80 bg-zinc-950/85 px-3 text-sm font-medium leading-none text-zinc-300 shadow-sm backdrop-blur-sm transition hover:border-red-500/50 hover:bg-red-950/50 hover:text-red-200"
                      aria-label="이미지 제거"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex w-full justify-center">
                    <CanvasEditor
                      registerCanvas={registerCanvas(item.id)}
                      imageSrc={item.url}
                      title={item.title}
                      body={item.body}
                      textOffsetX={item.textOffsetX}
                      textOffsetY={item.textOffsetY}
                      onTextOffsetChange={(x, y) =>
                        updateItem(item.id, {
                          textOffsetX: x,
                          textOffsetY: y,
                        })
                      }
                      isGenerating={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p
            className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {activeItem && (
          <section className="mt-10 flex flex-col items-center">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl">
              <h2 className="mb-4 text-left text-sm font-medium uppercase tracking-wider text-zinc-500">
                편집 · 활성 카드
              </h2>
              <p className="mb-4 text-xs text-zinc-500">
                미리보기 카드에서 텍스트를 드래그하면 위치가 저장됩니다.
              </p>

              <div className="space-y-4 border-t border-zinc-800 pt-6 text-left">
                <div>
                  <label
                    htmlFor="edit-title"
                    className="mb-1.5 block text-xs font-medium text-zinc-500"
                  >
                    제목 수정
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={activeItem.title}
                    onChange={(e) =>
                      updateItem(activeItem.id, { title: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-700 bg-[#111] px-4 py-2 text-sm text-white outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-body"
                    className="mb-1.5 block text-xs font-medium text-zinc-500"
                  >
                    본문 수정
                  </label>
                  <textarea
                    id="edit-body"
                    value={activeItem.body}
                    onChange={(e) =>
                      updateItem(activeItem.id, { body: e.target.value })
                    }
                    rows={5}
                    className="w-full resize-y rounded-lg border border-gray-700 bg-[#111] px-4 py-2 text-sm text-white outline-none focus:border-gray-500"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={openGenerateModal}
                    disabled={!keyword.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/50 bg-violet-950/40 px-5 py-2.5 text-sm font-medium text-violet-200 transition hover:bg-violet-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    텍스트 재생성
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    다운로드 (PNG)
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
