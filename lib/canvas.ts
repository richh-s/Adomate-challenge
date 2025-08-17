import type { TextNode } from "./types";

export const measureLineWidth = (
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
) => {
  if (!text) return 0;
  const base = ctx.measureText(text).width;
  return text.length <= 1 ? base : base + (text.length - 1) * letterSpacing;
};

export const drawLineWithSpacing = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
) => {
  if (!text) return;
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }
  let currX = x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, currX, y);
    currX += ctx.measureText(ch).width + letterSpacing;
  }
};

export const getNodeBounds = (
  ctx: CanvasRenderingContext2D,
  node: TextNode
): { x: number; y: number; w: number; h: number } => {
  const lines = (node.text || "").split("\n");
  const lineH = node.fontSize * node.lineHeight;
  const heights = lineH * Math.max(1, lines.length);

  ctx.font = `${node.fontWeight} ${node.fontSize}px '${node.fontFamily}', Arial, sans-serif`;

  let maxW = 0;
  for (const line of lines) {
    maxW = Math.max(maxW, measureLineWidth(ctx, line, node.letterSpacing));
  }

  let startX = node.x;
  if (node.align === "center") startX = node.x - maxW / 2;
  else if (node.align === "right") startX = node.x - maxW;

  return { x: startX, y: node.y, w: maxW, h: heights };
};

export const drawAll = ({
  canvas,
  bgImage,
  bgUrl,
  nodes,
  selectedId,
}: {
  canvas: HTMLCanvasElement;
  bgImage: HTMLImageElement | null;
  bgUrl: string | null;
  nodes: TextNode[];
  selectedId: string | null;
}) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bgImage && bgUrl) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#1f2937"; // slate-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  nodes.forEach((node) => {
    if (!node.visible) return;

    ctx.save();
    ctx.globalAlpha = node.opacity;
    ctx.fillStyle = node.fill;
    ctx.font = `${node.fontWeight} ${node.fontSize}px '${node.fontFamily}', Arial, sans-serif`;
    ctx.textBaseline = "top";

    const lines = (node.text || "").split("\n");
    const lineH = node.fontSize * node.lineHeight;

    if (node.shadow?.enabled) {
      ctx.shadowColor = node.shadow.color;
      ctx.shadowBlur = node.shadow.blur;
      ctx.shadowOffsetX = node.shadow.offsetX;
      ctx.shadowOffsetY = node.shadow.offsetY;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    let maxW = 0;
    for (const line of lines) {
      maxW = Math.max(maxW, measureLineWidth(ctx, line, node.letterSpacing));
    }

    let baseX = node.x;
    if (node.align === "center") baseX = node.x - maxW / 2;
    else if (node.align === "right") baseX = node.x - maxW;

    lines.forEach((line, i) => {
      drawLineWithSpacing(ctx, line, baseX, node.y + i * lineH, node.letterSpacing);
    });

    ctx.restore();

    if (node.id === selectedId) {
      const { x, y, w, h } = getNodeBounds(ctx, node);
      ctx.save();
      ctx.strokeStyle = "rgba(59,130,246,0.9)"; // blue-500
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
      ctx.restore();
    }
  });
};

export const exportCanvasPNG = (canvas: HTMLCanvasElement, name = "image-composition.png") => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  a.click();
};
