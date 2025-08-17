"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  getNodeMetrics,
  HANDLE_SIZE,
  ROTATE_HANDLE_OFFSET,
  rot,
  DEG,
  drawAll,
} from "@/features/editor/lib/canvas";
import type { TextNode } from "@/features/editor/lib/types";

const SNAP_PX = 6;

type DragMode =
  | { kind: "move" }
  | { kind: "resize-left" }
  | { kind: "resize-right" }
  | { kind: "rotate" }
  | { kind: "none" };

function isNear(p: { x: number; y: number }, q: { x: number; y: number }, r: number) {
  const dx = p.x - q.x, dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy) <= r;
}

export function useCanvasInteractions(opts: {
  // 👇 allow null in the ref type (matches useRef<HTMLCanvasElement | null>(null))
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  bgImageRef: React.MutableRefObject<HTMLImageElement | null>;
  stageWidth: number;
  bgUrl: string | null;

  texts: TextNode[];
  setTexts: React.Dispatch<React.SetStateAction<TextNode[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  selectedNode: TextNode | null;
  pushHistory: (saveToLocal?: boolean) => void;
}) {
  const {
    canvasRef, bgImageRef, stageWidth, bgUrl,
    texts, setTexts, selectedId, setSelectedId, selectedNode, pushHistory,
  } = opts;

  const [snapGuides, setSnapGuides] = useState<{ v?: boolean; h?: boolean; vx?: number; hy?: number }>();

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    nodeX: number;
    nodeY: number;
    boxWidth?: number | null;
    startAngle?: number; // deg
    startVectorAngle?: number; // rad
    dragMode: DragMode;
  } | null>(null);

  function handleCentersWorld(
    ctx: CanvasRenderingContext2D,
    node: TextNode
  ): {
    left: { x: number; y: number };
    right: { x: number; y: number };
    rotate: { x: number; y: number };
    cx: number; cy: number; w: number; h: number;
  } {
    const { w, h, cx, cy } = getNodeMetrics(ctx, node);
    const a = (node.angle ?? 0) * DEG;

    const leftLocal  = { x: -w / 2 - 8, y: 0 };
    const rightLocal = { x:  w / 2 + 8, y: 0 };
    const rotLocal   = { x: 0, y: -h / 2 - ROTATE_HANDLE_OFFSET };

    const L = rot(leftLocal.x, leftLocal.y, a);
    const R = rot(rightLocal.x, rightLocal.y, a);
    const O = rot(rotLocal.x,  rotLocal.y,  a);

    return {
      left: { x: cx + L.x, y: cy + L.y },
      right:{ x: cx + R.x, y: cy + R.y },
      rotate:{ x: cx + O.x, y: cy + O.y },
      cx, cy, w, h,
    };
  }

  const hitTest = useCallback(
    (px: number, py: number): { node: TextNode; mode: DragMode } | null => {
      const c = canvasRef.current;
      if (!c) return null;
      const ctx = c.getContext("2d");
      if (!ctx) return null;

      for (let i = texts.length - 1; i >= 0; i--) {
        const node = texts[i];
        if (!node.visible) continue;

        const { left, right, rotate, cx, cy, w, h } = handleCentersWorld(ctx, node);
        const hitR = HANDLE_SIZE * 0.75;
        const pt = { x: px, y: py };
        if (isNear(pt, left, hitR))   return { node, mode: { kind: "resize-left" } };
        if (isNear(pt, right, hitR))  return { node, mode: { kind: "resize-right" } };
        if (isNear(pt, rotate, hitR)) return { node, mode: { kind: "rotate" } };

        const angle = -((node.angle ?? 0) * DEG);
        const lx =  (px - cx) * Math.cos(angle) - (py - cy) * Math.sin(angle);
        const ly =  (px - cx) * Math.sin(angle) + (py - cy) * Math.cos(angle);
        if (lx >= -w/2 && lx <= w/2 && ly >= -h/2 && ly <= h/2) {
          return { node, mode: { kind: "move" } };
        }
      }
      return null;
    },
    [texts, canvasRef]
  );

  const onCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = hitTest(x, y);
    if (hit) {
      setSelectedId(hit.node.id);
      if (!hit.node.locked) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const { cx, cy } = getNodeMetrics(ctx, hit.node);
        let startVectorAngle: number | undefined;
        if (hit.mode.kind === "rotate") {
          startVectorAngle = Math.atan2(y - cy, x - cx);
        }
        dragStartRef.current = {
          pointerX: x,
          pointerY: y,
          nodeX: hit.node.x,
          nodeY: hit.node.y,
          boxWidth: hit.node.boxWidth ?? 0,
          startAngle: hit.node.angle ?? 0,
          startVectorAngle,
          dragMode: hit.mode,
        };
      } else {
        dragStartRef.current = null;
      }
    } else {
      setSelectedId(null);
      dragStartRef.current = null;
    }
  }, [hitTest, setSelectedId]);

  const onCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const drag = dragStartRef.current;
    if (!drag || !selectedId) return;
    if (!selectedNode || selectedNode.locked) return;

    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - drag.pointerX;
    const dy = y - drag.pointerY;

    if (drag.dragMode.kind === "move") {
      let nextX = drag.nodeX + dx;
      let nextY = drag.nodeY + dy;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const temp = { ...selectedNode, x: nextX, y: nextY };
      const metrics = getNodeMetrics(ctx, temp);
      const nodeCx = metrics.cx;
      const nodeCy = metrics.cy;
      const canvasCx = canvas.width / 2;
      const canvasCy = canvas.height / 2;

      let v = false, hGuide = false, vx = canvasCx, hy = canvasCy;
      if (Math.abs(nodeCx - canvasCx) <= SNAP_PX) {
        nextX += (canvasCx - nodeCx);
        v = true;
      }
      if (Math.abs(nodeCy - canvasCy) <= SNAP_PX) {
        nextY += (canvasCy - nodeCy);
        hGuide = true;
      }
      setSnapGuides({ v, h: hGuide, vx, hy });

      setTexts((prev) => prev.map((t) => (t.id === selectedId ? { ...t, x: nextX, y: nextY } : t)));
    } else if (drag.dragMode.kind === "rotate") {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { cx, cy } = getNodeMetrics(ctx, selectedNode);
      const currentVectorAngle = Math.atan2(y - cy, x - cx);
      const startVec = drag.startVectorAngle ?? 0;
      const deltaDeg = (currentVectorAngle - startVec) * (180 / Math.PI);
      const nextAngle = (drag.startAngle ?? 0) + deltaDeg;

      setTexts((prev) => prev.map((t) => (t.id === selectedId ? { ...t, angle: nextAngle } : t)));
    } else if (drag.dragMode.kind === "resize-left" || drag.dragMode.kind === "resize-right") {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { cx, cy } = getNodeMetrics(ctx, selectedNode);
      const a = (selectedNode.angle ?? 0) * DEG;

      const lx0 = (drag.pointerX - cx) * Math.cos(-a) - (drag.pointerY - cy) * Math.sin(-a);
      const lx1 = (x - cx) * Math.cos(-a) - (y - cy) * Math.sin(-a);
      const dLocalX = lx1 - lx0;

      const startWidth = Math.max(0, drag.boxWidth ?? 0);
      let nextWidth =
        drag.dragMode.kind === "resize-right" ? startWidth + dLocalX : startWidth - dLocalX;

      nextWidth = Math.max(80, nextWidth);

      setTexts((prev) => prev.map((t) => (t.id === selectedId ? { ...t, boxWidth: nextWidth } : t)));
    }
  }, [selectedId, selectedNode, setTexts]);

  const onCanvasMouseUp = useCallback(() => {
    if (dragStartRef.current) pushHistory(false);
    dragStartRef.current = null;
    setSnapGuides(undefined);
  }, [pushHistory]);

  // Also end drag if mouseup happens outside
  useEffect(() => {
    const onUp = () => {
      if (dragStartRef.current) {
        pushHistory(false);
        dragStartRef.current = null;
      }
      setSnapGuides(undefined);
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [pushHistory]);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawAll({
      canvas: c,
      bgImage: bgImageRef.current,
      bgUrl,
      nodes: texts,
      selectedId,
      snapGuides,
    });
  }, [canvasRef, bgImageRef, bgUrl, texts, selectedId, snapGuides]);

  return {
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    snapGuides,
    redraw,
  };
}
