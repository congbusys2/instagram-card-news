/**
 * 클라이언트 전용: 파일을 1:1 중앙 크롭 후 data URL로 반환
 */
export function cropToSquareDataUrl(
  file: File,
  maxSide = 1080,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const side = Math.min(w, h);
      const sx = (w - side) / 2;
      const sy = (h - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = maxSide;
      canvas.height = maxSide;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("캔버스를 사용할 수 없습니다."));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSide, maxSide);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러올 수 없습니다."));
    };
    img.src = url;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\n+/);
  const result: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) continue;
    let line = "";
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        result.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) result.push(line);
  }
  return result.length ? result : [""];
}

/**
 * 정사각 이미지 data URL 위에 텍스트를 그립니다. 그림자로 가독성을 높입니다.
 */
export function renderSquareWithText(
  croppedDataUrl: string,
  text: string,
  targetCanvas: HTMLCanvasElement
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      targetCanvas.width = w;
      targetCanvas.height = h;
      const ctx = targetCanvas.getContext("2d");
      if (!ctx) {
        reject(new Error("캔버스를 사용할 수 없습니다."));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const displayText = text.trim();
      if (!displayText) {
        resolve();
        return;
      }

      const padding = w * 0.08;
      const maxTextWidth = w - padding * 2;
      let fontSize = Math.max(18, Math.floor(w / 13));

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const fontFamily =
        'system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

      const fitFont = (): string[] => {
        let lines: string[] = [];
        for (let attempt = 0; attempt < 40; attempt++) {
          ctx.font = `600 ${fontSize}px ${fontFamily}`;
          lines = wrapLines(ctx, displayText, maxTextWidth);
          const lineHeight = fontSize * 1.4;
          const blockHeight = lines.length * lineHeight;
          const widest = Math.max(
            ...lines.map((ln) => ctx.measureText(ln).width),
            0
          );
          if (widest <= maxTextWidth && blockHeight <= h * 0.55 && fontSize >= 16) {
            return lines;
          }
          fontSize -= 2;
          if (fontSize < 14) {
            ctx.font = `600 ${14}px ${fontFamily}`;
            return wrapLines(ctx, displayText, maxTextWidth);
          }
        }
        return lines;
      };

      const lines = fitFont();
      const lineHeight = fontSize * 1.4;
      const totalHeight = lines.length * lineHeight;
      let y = h / 2 - totalHeight / 2 + lineHeight / 2;
      const x = w / 2;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        ctx.shadowColor = "rgba(0,0,0,0.72)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = Math.max(2, fontSize / 14);
        ctx.lineJoin = "round";
        ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
        y += lineHeight;
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      resolve();
    };
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = croppedDataUrl;
  });
}

export function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지를 저장할 수 없습니다."));
      },
      "image/jpeg",
      quality
    );
  });
}
