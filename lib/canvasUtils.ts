/**
 * 인스타 카드뉴스용 캔버스 유틸 (클라이언트 전용)
 */

export const CARD_CANVAS_SIZE = 1024;

/** 1:1 중앙 크롭 후 정사각 캔버스에 그리기 */
export function drawSquareCroppedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number
): void {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const side = Math.min(w, h);
  const sx = (w - side) / 2;
  const sy = (h - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
}

function wrapLineToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** 가독성용 그라데이션 오버레이 (하단으로 갈수록 진해짐) */
export function drawReadableOverlay(
  ctx: CanvasRenderingContext2D,
  size: number,
  options?: { maxAlpha?: number }
): void {
  const maxA = options?.maxAlpha ?? 0.68;
  ctx.save();
  const g = ctx.createLinearGradient(0, size * 0.35, 0, size);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.5, `rgba(0,0,0,${maxA * 0.3})`);
  g.addColorStop(1, `rgba(0,0,0,${maxA})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

export type DrawCardNewsTextOptions = {
  /** 기본 좌측 여백(padX) 기준 X 이동(px, 1024 좌표계) */
  offsetX?: number;
  /** 블록 수직 중심 기준 Y 이동(px, 1024 좌표계) */
  offsetY?: number;
};

/**
 * 제목 + 본문을 좌측 정렬 블록으로 렌더링 (흰색, 그림자). offset은 블록 전체 이동.
 */
export function drawCardNewsText(
  ctx: CanvasRenderingContext2D,
  size: number,
  title: string,
  body: string,
  options?: DrawCardNewsTextOptions
): void {
  const titleStr = title.trim();
  const bodyStr = body.trim();
  if (!titleStr && !bodyStr) return;

  const padX = size * 0.06;
  const gapTitleBody = size * 0.022;
  const maxW = size - 2 * padX;
  const offsetX = options?.offsetX ?? 0;
  const offsetY = options?.offsetY ?? 0;

  let titleSize = Math.floor(size / 16);
  titleSize = Math.max(36, Math.min(56, titleSize));
  let bodySize = Math.floor(size / 28);
  bodySize = Math.max(22, Math.min(34, bodySize));

  const titleLines: string[] = [];
  const bodyLines: string[] = [];

  if (titleStr) {
    ctx.font = `bold ${titleSize}px system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif`;
    titleLines.push(...wrapLineToWidth(ctx, titleStr, maxW).slice(0, 2));
  }
  if (bodyStr) {
    ctx.font = `600 ${bodySize}px system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif`;
    const paragraphs = bodyStr.split(/\n+/).filter(Boolean);
    for (const p of paragraphs) {
      bodyLines.push(...wrapLineToWidth(ctx, p, maxW));
    }
  }

  const titleLh = titleSize * 1.2;
  const bodyLh = bodySize * 1.35;
  let totalH = 0;
  if (titleLines.length) {
    totalH += titleLines.length * titleLh;
  }
  if (titleLines.length && bodyLines.length) {
    totalH += gapTitleBody;
  }
  if (bodyLines.length) {
    totalH += Math.min(bodyLines.length, 8) * bodyLh;
  }

  const leftX = padX + offsetX;
  let cursorY = size / 2 + offsetY - totalH / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";

  if (titleLines.length) {
    ctx.font = `bold ${titleSize}px system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif`;
    for (const ln of titleLines) {
      ctx.fillText(ln, leftX, cursorY);
      cursorY += titleLh;
    }
    if (bodyLines.length) {
      cursorY += gapTitleBody;
    }
  }

  if (bodyLines.length) {
    ctx.font = `600 ${bodySize}px system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif`;
    for (const ln of bodyLines.slice(0, 8)) {
      ctx.fillText(ln, leftX, cursorY);
      cursorY += bodyLh;
    }
  }

  ctx.restore();
}

export type RenderCardNewsCanvasOptions = DrawCardNewsTextOptions;

/** 이미지 로드 후 한 번에 그리기: 크롭 → 오버레이 → 텍스트 */
export function renderCardNewsCanvas(
  canvas: HTMLCanvasElement,
  imageSrc: string,
  title: string,
  body: string,
  textOptions?: RenderCardNewsCanvasOptions
): Promise<void> {
  const size = CARD_CANVAS_SIZE;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D를 사용할 수 없습니다."));
        return;
      }
      canvas.width = size;
      canvas.height = size;
      drawSquareCroppedImage(ctx, img, size);
      if (title.trim() || body.trim()) {
        drawReadableOverlay(ctx, size);
        drawCardNewsText(ctx, size, title, body, textOptions);
      }
      resolve();
    };
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = imageSrc;
  });
}
