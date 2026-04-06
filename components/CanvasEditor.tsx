"use client";

import { useEffect, useRef } from "react";
import {
  CARD_CANVAS_SIZE,
  renderCardNewsCanvas,
} from "@/lib/canvasUtils";

export type CanvasEditorProps = {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  registerCanvas?: (node: HTMLCanvasElement | null) => void;
  imageSrc: string | null;
  title: string;
  body: string;
  textOffsetX?: number;
  textOffsetY?: number;
  onTextOffsetChange?: (x: number, y: number) => void;
  isGenerating: boolean;
};

export function CanvasEditor({
  canvasRef: canvasRefProp,
  registerCanvas,
  imageSrc,
  title,
  body,
  textOffsetX = 0,
  textOffsetY = 0,
  onTextOffsetChange,
  isGenerating,
}: CanvasEditorProps) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const setRefs = (node: HTMLCanvasElement | null) => {
    internalRef.current = node;
    if (canvasRefProp) {
      (canvasRefProp as React.MutableRefObject<HTMLCanvasElement | null>).current =
        node;
    }
    registerCanvas?.(node);
  };

  useEffect(() => {
    const canvas = internalRef.current;
    if (!canvas || !imageSrc) return;

    let cancelled = false;
    void renderCardNewsCanvas(canvas, imageSrc, title, body, {
      offsetX: textOffsetX,
      offsetY: textOffsetY,
    }).catch(() => {
      if (!cancelled && canvas.getContext("2d")) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#18181b";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, title, body, textOffsetX, textOffsetY]);

  const canDragText =
    Boolean(onTextOffsetChange) && Boolean(title.trim() || body.trim());

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDragText || !onTextOffsetChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: textOffsetX,
      origY: textOffsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !onTextOffsetChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = CARD_CANVAS_SIZE / rect.width;
    const dx = (e.clientX - dragRef.current.startX) * scale;
    const dy = (e.clientY - dragRef.current.startY) * scale;
    onTextOffsetChange(dragRef.current.origX + dx, dragRef.current.origY + dy);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative inline-block w-full max-w-[min(100%,520px)]">
      {isGenerating && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/55 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-lg bg-zinc-900/90 px-4 py-2 text-sm font-medium text-white ring-1 ring-zinc-700">
            문구 생성 중…
          </p>
        </div>
      )}
      <canvas
        ref={setRefs}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`h-auto w-full rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl ${
          canDragText ? "cursor-grab touch-none active:cursor-grabbing" : ""
        }`}
      />
    </div>
  );
}
