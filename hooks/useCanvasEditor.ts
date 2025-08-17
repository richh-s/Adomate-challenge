"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  drawAll,
  getNodeBounds,
  getNodeMetrics,
  exportCanvasPNG,
  HANDLE_SIZE,
  ROTATE_HANDLE_OFFSET,
  rot,
  DEG,
} from "../lib/canvas";
import type { SerializableState, StageSize, TextNode } from "@/lib/types";

const START_SIZE: StageSize = { width: 960, height: 540 };
const MAX_HISTORY = 40;
const LS_KEY = "itc_canvas_state";

const SNAP_PX = 6;

type DragMode =
  | { kind: "move" }
  | { kind: "resize-left" }
  | { kind: "resize-right" }
  | { kind: "rotate" }
  | { kind: "none" };

export function useCanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Keep original uploaded size for export
  const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

  const [stage, setStage] = useState<StageSize>(START_SIZE);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<"text" | "layers" | "history">("text");

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

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [snapGuides, setSnapGuides] = useState<{ v?: boolean; h?: boolean; vx?: number; hy?: number }>();

  const selectedNode = useMemo(
    () => texts.find((t) => t.id === selectedId) || null,
    [texts, selectedId]
  );

  const serialize = useCallback(
    (): string => JSON.stringify({ stage, bgUrl, texts } as SerializableState),
    [stage, bgUrl, texts]
  );

  const pushHistory = useCallback(
    (saveToLocal = true) => {
      const snap = serialize();
      const next = history.slice(0, historyIndex + 1);
      next.push(snap);
      if (next.length > MAX_HISTORY) next.shift();
      setHistory(next);
      setHistoryIndex(next.length - 1);
      if (saveToLocal) localStorage.setItem(LS_KEY, snap);
    },
    [history, historyIndex, serialize]
  );

  const restoreFrom = useCallback((json: string) => {
    try {
      const data = JSON.parse(json) as SerializableState;
      setStage(data.stage);
      setBgUrl(data.bgUrl);

      if (data.bgUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          bgImageRef.current = img;
          naturalSizeRef.current = { w: data.stage.width, h: data.stage.height };
          if (canvasRef.current) {
            drawAll({
              canvas: canvasRef.current,
              bgImage: bgImageRef.current,
              bgUrl: data.bgUrl,
              nodes: data.texts,
              selectedId: null,
            });
          }
        };
        img.src = data.bgUrl;
      } else {
        bgImageRef.current = null;
        naturalSizeRef.current = null;
      }

      setTexts(data.texts);
      setSelectedId(null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      restoreFrom(saved);
      setHistory([saved]);
      setHistoryIndex(0);
    }
  }, [restoreFrom]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    drawAll({
      canvas: c,
      bgImage: bgImageRef.current,
      bgUrl,
      nodes: texts,
      selectedId,
      snapGuides,
    });
  }, [stage, bgUrl, texts, selectedId, snapGuides]);

  /* -------- image upload -------- */
  const handleUpload = useCallback(
    (file: File) => {
      if (!file.type.includes("png")) {
        alert("Only PNG files are supported");
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        naturalSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };

        // display fit (unchanged behavior)
        const maxW = 1200;
        const maxH = 800;
        const ratio = img.naturalWidth / img.naturalHeight;
        let width = Math.min(maxW, img.naturalWidth);
        let height = width / ratio;
        if (height > maxH) {
          height = maxH;
          width = height * ratio;
        }

        setStage({ width, height });
        setBgUrl(url);
        bgImageRef.current = img;
        setSelectedId(null);
        pushHistory();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        alert("Could not load that image.");
      };
      img.src = url;
    },
    [pushHistory]
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleUpload]
  );

  /* -------- text ops -------- */
  const addText = useCallback(() => {
    const id = crypto.randomUUID();
    const node: TextNode = {
      id,
      text: "Edit this text",
      x: stage.width / 2,
      y: stage.height / 2,
      fontFamily: "Arial",
      fontSize: 30,
      fontWeight: "normal",
      fill: "#ffffff",
      opacity: 1,
      align: "center",
      lineHeight: 1.16,
      letterSpacing: 0,
      shadow: { enabled: false, color: "#000000", blur: 5, offsetX: 5, offsetY: 5 },
      visible: true,
      locked: false,
      angle: 0,
      boxWidth: 0,
    };
    setTexts((prev) => [...prev, node]);
    setSelectedId(id);
    pushHistory();
  }, [pushHistory, stage.width, stage.height]);

  const updateSelected = useCallback(
    (patch: Partial<TextNode>, save = true) => {
      if (!selectedId) return;
      setTexts((prev) => prev.map((t) => (t.id === selectedId ? { ...t, ...patch } : t)));
      if (save) pushHistory(false);
    },
    [selectedId, pushHistory]
  );

  const centerSelected = useCallback(() => {
    if (!selectedId) return;
    setTexts((prev) =>
      prev.map((t) =>
        t.id === selectedId ? { ...t, x: stage.width / 2, y: stage.height / 2 } : t
      )
    );
    pushHistory();
  }, [selectedId, stage.width, stage.height, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setTexts((prev) => prev.filter((t) => t.id !== selectedId));
    setSelectedId(null);
    pushHistory();
  }, [selectedId, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    setTexts((prev) => {
      const base = prev.find((t) => t.id === selectedId);
      if (!base) return prev;
      const copy: TextNode = {
        ...base,
        id: crypto.randomUUID(),
        x: base.x + 20,
        y: base.y + 20,
      };
      return [...prev, copy];
    });
    pushHistory();
  }, [selectedId, pushHistory]);

  /* -------- z-order & visibility -------- */
  const bringForward = useCallback(
    (id: string) => {
      setTexts((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx < 0 || idx === prev.length - 1) return prev;
        const copy = [...prev];
        const [item] = copy.splice(idx, 1);
        copy.splice(idx + 1, 0, item);
        return copy;
      });
      pushHistory(false);
    },
    [pushHistory]
  );

  const sendBackward = useCallback(
    (id: string) => {
      setTexts((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx <= 0) return prev;
        const copy = [...prev];
        const [item] = copy.splice(idx, 1);
        copy.splice(idx - 1, 0, item);
        return copy;
      });
      pushHistory(false);
    },
    [pushHistory]
  );

  const reorderLayer = useCallback(
    (srcId: string, destId: string) => {
      setTexts((prev) => {
        const from = prev.findIndex((t) => t.id === srcId);
        const to = prev.findIndex((t) => t.id === destId);
        if (from < 0 || to < 0 || from === to) return prev;
        const copy = [...prev];
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item); // insert at dest row
        return copy;
      });
      pushHistory(false);
    },
    [pushHistory]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t)));
      pushHistory(false);
    },
    [pushHistory]
  );

  const toggleLock = useCallback(
    (id: string) => {
      setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t)));
      pushHistory(false);
    },
    [pushHistory]
  );

  const removeLayer = useCallback(
    (id: string) => {
      setTexts((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) setSelectedId(null);
      pushHistory();
    },
    [selectedId, pushHistory]
  );

  const duplicateLayer = useCallback(
    (id: string) => {
      setTexts((prev) => {
        const base = prev.find((t) => t.id === id);
        if (!base) return prev;
        const copy = { ...base, id: crypto.randomUUID(), x: base.x + 20, y: base.y + 20 };
        return [...prev, copy];
      });
      pushHistory();
    },
    [pushHistory]
  );

  const selectLayer = useCallback((id: string) => setSelectedId(id), []);

  /* -------- hit test (handles + rotated body) -------- */
  function handleCentersWorld(
    ctx: CanvasRenderingContext2D,
    node: TextNode
  ): { left: { x: number; y: number }; right: { x: number; y: number }; rotate: { x: number; y: number }; cx: number; cy: number; w: number; h: number } {
    const { w, h, cx, cy } = getNodeMetrics(ctx, node);
    const a = (node.angle ?? 0) * DEG;

    // local positions
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

  function isNear(p: {x:number;y:number}, q:{x:number;y:number}, r:number) {
    const dx = p.x - q.x, dy = p.y - q.y;
    return Math.sqrt(dx*dx + dy*dy) <= r;
  }

  const hitTest = useCallback(
    (px: number, py: number): { node: TextNode; mode: DragMode } | null => {
      const c = canvasRef.current!;
      const ctx = c.getContext("2d")!;
      for (let i = texts.length - 1; i >= 0; i--) {
        const node = texts[i];
        if (!node.visible) continue;

        // handle hits
        const { left, right, rotate, cx, cy, w, h } = handleCentersWorld(ctx, node);
        const hitR = HANDLE_SIZE * 0.75;
        const pt = { x: px, y: py };
        if (isNear(pt, left, hitR))   return { node, mode: { kind: "resize-left" } };
        if (isNear(pt, right, hitR))  return { node, mode: { kind: "resize-right" } };
        if (isNear(pt, rotate, hitR)) return { node, mode: { kind: "rotate" } };

        // body hit – rotate pointer into local space and test rect
        const angle = -((node.angle ?? 0) * DEG);
        const lx =  (px - cx) * Math.cos(angle) - (py - cy) * Math.sin(angle);
        const ly =  (px - cx) * Math.sin(angle) + (py - cy) * Math.cos(angle);
        if (lx >= -w/2 && lx <= w/2 && ly >= -h/2 && ly <= h/2) {
          return { node, mode: { kind: "move" } };
        }
      }
      return null;
    },
    [texts]
  );

  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = hitTest(x, y);
      if (hit) {
        setSelectedId(hit.node.id);
        if (!hit.node.locked) {
          const ctx = canvas.getContext("2d")!;
          const { cx, cy } = getNodeMetrics(ctx, hit.node);
          let startVectorAngle: number | undefined;

          if (hit.mode.kind === "rotate") {
            startVectorAngle = Math.atan2(y - cy, x - cx); // radians
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
    },
    [hitTest]
  );

  const onCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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

        // snap-to-center uses the true canvas center
        const ctx = canvas.getContext("2d")!;
        const temp = { ...selectedNode, x: nextX, y: nextY };
        const metrics = getNodeMetrics(ctx, temp);
        const nodeCx = metrics.cx;
        const nodeCy = metrics.cy;
        const canvasCx = canvas.width / 2;
        const canvasCy = canvas.height / 2;

        let v = false, hGuide = false, vx = canvasCx, hy = canvasCy;

        if (Math.abs(nodeCx - canvasCx) <= SNAP_PX) {
          // shift so centers match exactly
          nextX += (canvasCx - nodeCx);
          v = true;
        }
        if (Math.abs(nodeCy - canvasCy) <= SNAP_PX) {
          nextY += (canvasCy - nodeCy);
          hGuide = true;
        }
        setSnapGuides({ v, h: hGuide, vx, hy });

        setTexts((prev) =>
          prev.map((t) => (t.id === selectedId ? { ...t, x: nextX, y: nextY } : t))
        );
      } else if (drag.dragMode.kind === "rotate") {
        const ctx = canvas.getContext("2d")!;
        const { cx, cy } = getNodeMetrics(ctx, selectedNode);
        const currentVectorAngle = Math.atan2(y - cy, x - cx); // radians
        const startVec = drag.startVectorAngle ?? 0;
        const deltaDeg = (currentVectorAngle - startVec) * (180 / Math.PI);
        const nextAngle = (drag.startAngle ?? 0) + deltaDeg;

        setTexts((prev) =>
          prev.map((t) => (t.id === selectedId ? { ...t, angle: nextAngle } : t))
        );
      } else if (drag.dragMode.kind === "resize-left" || drag.dragMode.kind === "resize-right") {
        // project pointer delta into local X-axis
        const ctx = canvas.getContext("2d")!;
        const { cx, cy, w } = getNodeMetrics(ctx, selectedNode);
        const a = (selectedNode.angle ?? 0) * DEG;

        // current pointer in local space
        const lx0 =  (drag.pointerX - cx) * Math.cos(-a) - (drag.pointerY - cy) * Math.sin(-a);
        const lx1 =  (x - cx) * Math.cos(-a) - (y - cy) * Math.sin(-a);
        const dLocalX = lx1 - lx0;

        const startWidth = Math.max(0, drag.boxWidth ?? 0);
        let nextWidth =
          drag.dragMode.kind === "resize-right" ? startWidth + dLocalX : startWidth - dLocalX;

        nextWidth = Math.max(80, nextWidth);

        // keep center constant: adjust node.x so the visual center doesn't drift
        const cxCurrent = cx;
        const half = nextWidth / 2;

        let nextX: number;
        if (selectedNode.align === "left") nextX = cxCurrent - half;
        else if (selectedNode.align === "right") nextX = cxCurrent + half;
        else nextX = cxCurrent; // center anchoring

        setTexts((prev) =>
          prev.map((t) =>
            t.id === selectedId ? { ...t, boxWidth: nextWidth, x: nextX } : t
          )
        );
      }
    },
    [selectedId, selectedNode]
  );

  const onCanvasMouseUp = useCallback(() => {
    if (dragStartRef.current) pushHistory(false);
    dragStartRef.current = null;
    setSnapGuides(undefined);
  }, [pushHistory]);

  useEffect(() => {
    const onWinMouseUp = () => {
      if (dragStartRef.current) {
        pushHistory(false);
        dragStartRef.current = null;
      }
      setSnapGuides(undefined);
    };
    window.addEventListener("mouseup", onWinMouseUp);
    return () => window.removeEventListener("mouseup", onWinMouseUp);
  }, [pushHistory]);

  /* -------- keyboard -------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateSelected();
      }
      const step = e.shiftKey ? 10 : 1;
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp") updateSelected({ y: (selectedNode?.y ?? 0) - step }, false);
        if (e.key === "ArrowDown") updateSelected({ y: (selectedNode?.y ?? 0) + step }, false);
        if (e.key === "ArrowLeft") updateSelected({ x: (selectedNode?.x ?? 0) - step }, false);
        if (e.key === "ArrowRight") updateSelected({ x: (selectedNode?.x ?? 0) + step }, false);
        const c = canvasRef.current;
        if (c) drawAll({ canvas: c, bgImage: bgImageRef.current, bgUrl, nodes: texts, selectedId, snapGuides });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedNode, texts, bgUrl, snapGuides]);

  /* -------- history & export & reset -------- */
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    restoreFrom(history[idx]);
    setHistoryIndex(idx);
  }, [history, historyIndex, restoreFrom]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    restoreFrom(history[idx]);
    setHistoryIndex(idx);
  }, [history, historyIndex, restoreFrom]);

  const exportPNG = useCallback(() => {
    const displayCanvas = canvasRef.current;
    const natural = naturalSizeRef.current;
    if (!displayCanvas || !bgImageRef.current || !natural) {
      if (displayCanvas) exportCanvasPNG(displayCanvas);
      return;
    }

    const off = document.createElement("canvas");
    off.width = natural.w;
    off.height = natural.h;
    const scale = natural.w / stage.width;

    drawAll({
      canvas: off,
      bgImage: bgImageRef.current,
      bgUrl,
      nodes: texts,
      selectedId: null,
      scale,
    });

    exportCanvasPNG(off, "image-composition.png");
  }, [bgUrl, texts, stage.width]);

  const reset = useCallback(() => {
    if (!confirm("Reset the canvas? This will clear everything.")) return;
    setBgUrl(null);
    bgImageRef.current = null;
    naturalSizeRef.current = null;
    setTexts([]);
    setSelectedId(null);
    setStage(START_SIZE);
    setHistory([]);
    setHistoryIndex(-1);
    localStorage.removeItem(LS_KEY);
  }, []);

  return {
    canvasRef,
    fileInputRef,

    stage,
    setStage,
    bgUrl,
    texts,
    selectedId,
    selectedNode,
    activePanel,
    setActivePanel,

    addText,
    updateSelected,
    centerSelected,
    deleteSelected,
    duplicateSelected,

    bringForward,
    sendBackward,
    toggleVisibility,
    toggleLock,
    removeLayer,
    duplicateLayer,
    selectLayer,
    reorderLayer,

    onFileInputChange,
    exportPNG,
    reset,

    history,
    historyIndex,
    undo,
    redo,

    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
  };
}
