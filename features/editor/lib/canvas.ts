import type { TextNode } from "./types";

export const HANDLE_SIZE = 10;
export const ROTATE_HANDLE_OFFSET = 24; // px above top edge
export const DEG = Math.PI / 180;

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

export function wrapTextByWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number
): string[] {
  const out: string[] = [];
  const rawLines = (text || "").split("\n");

  for (const raw of rawLines) {
    const words = raw.split(" ");
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const candidate = line ? line + " " + words[i] : words[i];
      const w = measureLineWidth(ctx, candidate, letterSpacing);
      if (w <= maxWidth || line === "") {
        line = candidate;
      } else {
        out.push(line);
        line = words[i];
      }
    }
    out.push(line);
  }

  return out;
}

/**
 * Compute text metrics and center based on node settings (without rotation).
 * Returns lines, w, h, the unrotated startX/startY (top-left), and the center (cx, cy).
 */
export function getNodeMetrics(
  ctx: CanvasRenderingContext2D,
  node: TextNode
): { lines: string[]; w: number; h: number; startX: number; startY: number; cx: number; cy: number } {
  const angle = (node.angle ?? 0) * DEG;
  void angle; // angle not needed for metrics here, but kept for completeness

  ctx.font = `${node.fontWeight} ${node.fontSize}px '${node.fontFamily}', Arial, sans-serif`;

  const hasBox = !!node.boxWidth && node.boxWidth! > 0;
  const lines = hasBox
    ? wrapTextByWidth(ctx, node.text || "", node.boxWidth!, node.letterSpacing)
    : (node.text || "").split("\n");

  const lineH = node.fontSize * node.lineHeight;
  const h = lineH * Math.max(1, lines.length);

  let w = 0;
  if (hasBox) {
    w = node.boxWidth!;
  } else {
    for (const l of lines) w = Math.max(w, measureLineWidth(ctx, l, node.letterSpacing));
  }

  let startX = node.x;
  if (node.align === "center") startX = node.x - w / 2;
  else if (node.align === "right") startX = node.x - w;

  const startY = node.y;
  const cx = startX + w / 2;
  const cy = startY + h / 2;

  return { lines, w, h, startX, startY, cx, cy };
}

/** Rotate a point (lx, ly) around origin by angle radians. */
export function rot(lx: number, ly: number, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: lx * c - ly * s, y: lx * s + ly * c };
}

/**
 * Axis-aligned bounding box of a rotated rect.
 */
export function getNodeBounds(
  ctx: CanvasRenderingContext2D,
  node: TextNode
): { x: number; y: number; w: number; h: number; lines: string[]; cx: number; cy: number } {
  const { lines, w, h, startX, startY, cx, cy } = getNodeMetrics(ctx, node);
  const angle = (node.angle ?? 0) * DEG;

  // corners relative to center
  const halfW = w / 2;
  const halfH = h / 2;
  const corners = [
    rot(-halfW, -halfH, angle),
    rot( halfW, -halfH, angle),
    rot(-halfW,  halfH, angle),
    rot( halfW,  halfH, angle),
  ];
  const xs = corners.map((p) => p.x + cx);
  const ys = corners.map((p) => p.y + cy);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, lines, cx, cy };
}

function drawSelectionAndHandlesRotated(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angleRad: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);

  // selection rect
  ctx.strokeStyle = "rgba(59,130,246,0.9)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);

  // side handles (left/right)
  const handleFill = "rgba(59,130,246,0.95)";
  ctx.fillStyle = handleFill;

  const drawHandleCentered = (hx: number, hy: number) => {
    ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  };

  // mid-sides
  drawHandleCentered(-w / 2 - 8, 0); // left
  drawHandleCentered( w / 2 + 8, 0); // right

  // rotate handle (circle above top center)
  const ry = -h / 2 - ROTATE_HANDLE_OFFSET;
  ctx.beginPath();
  ctx.arc(0, ry, HANDLE_SIZE * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSnapGuides(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  guides?: { v?: boolean; h?: boolean; vx?: number; hy?: number }
) {
  if (!guides) return;
  ctx.save();
  ctx.strokeStyle = "rgba(168,85,247,0.95)"; // purple
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);

  if (guides.v && typeof guides.vx === "number") {
    ctx.beginPath();
    ctx.moveTo(guides.vx!, 0);
    ctx.lineTo(guides.vx!, canvas.height);
    ctx.stroke();
  }
  if (guides.h && typeof guides.hy === "number") {
    ctx.beginPath();
    ctx.moveTo(0, guides.hy!);
    ctx.lineTo(canvas.width, guides.hy!);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Main renderer.
 *
 * scale: multiplies sizes/positions (used for original-size export).
 */
export const drawAll = ({
  canvas,
  bgImage,
  bgUrl,
  nodes,
  selectedId,
  snapGuides,
  scale = 1,
}: {
  canvas: HTMLCanvasElement;
  bgImage: HTMLImageElement | null;
  bgUrl: string | null;
  nodes: TextNode[];
  selectedId: string | null;
  snapGuides?: { v?: boolean; h?: boolean; vx?: number; hy?: number };
  scale?: number;
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
    const angleRad = (node.angle ?? 0) * DEG;

    ctx.save();

    // style
    ctx.globalAlpha = node.opacity;
    ctx.fillStyle = node.fill;
    ctx.font = `${node.fontWeight} ${node.fontSize * scale}px '${node.fontFamily}', Arial, sans-serif`;
    ctx.textBaseline = "top";

    // scale-adjusted copy for metrics
    const scaled: TextNode = {
      ...node,
      x: node.x * scale,
      y: node.y * scale,
      fontSize: node.fontSize * scale,
      letterSpacing: node.letterSpacing * scale,
      shadow: {
        ...node.shadow,
        blur: node.shadow.blur * scale,
        offsetX: node.shadow.offsetX * scale,
        offsetY: node.shadow.offsetY * scale,
      },
      boxWidth: node.boxWidth ? node.boxWidth * scale : node.boxWidth,
    };

    const { lines, w, h, cx, cy } = getNodeMetrics(ctx, scaled);

    // shadow
    if (scaled.shadow?.enabled) {
      ctx.shadowColor = scaled.shadow.color;
      ctx.shadowBlur = scaled.shadow.blur;
      ctx.shadowOffsetX = scaled.shadow.offsetX;
      ctx.shadowOffsetY = scaled.shadow.offsetY;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // draw in rotated local space (origin at center)
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    const lineH = scaled.fontSize * scaled.lineHeight;
    const left = -w / 2;
    const top = -h / 2;

    lines.forEach((line, i) => {
      drawLineWithSpacing(ctx, line, left, top + i * lineH, scaled.letterSpacing);
    });

    ctx.restore();

    // selection/handles at display time only
    if (scale === 1 && node.id === selectedId) {
      drawSelectionAndHandlesRotated(ctx, cx, cy, w, h, angleRad);
    }
  });

  if (scale === 1) {
    drawSnapGuides(ctx, canvas, snapGuides);
  }
};

export const exportCanvasPNG = (canvas: HTMLCanvasElement, name = "image-composition.png") => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  a.click();
};
