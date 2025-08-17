"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawAll, getNodeBounds, exportCanvasPNG } from "../lib/canvas"; // <-- if your path is "@/lib/canvas", change back
import type { SerializableState, StageSize, TextNode } from "@/lib/types";

const START_SIZE: StageSize = { width: 960, height: 540 };
const MAX_HISTORY = 40;
const LS_KEY = "itc_canvas_state";

export function useCanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [stage, setStage] = useState<StageSize>(START_SIZE);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<"text" | "layers" | "history">("text");

  // when dragging, store initial pointer & node positions
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    nodeX: number;
    nodeY: number;
  } | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
      }

      setTexts(data.texts);
      setSelectedId(null);
    } catch {
      // ignore bad snapshot
    }
  }, []);

  // initial autosave load
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      restoreFrom(saved);
      setHistory([saved]);
      setHistoryIndex(0);
    }
  }, [restoreFrom]);

  // redraw on any change
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    drawAll({
      canvas: c,
      bgImage: bgImageRef.current,
      bgUrl,
      nodes: texts,
      selectedId,
    });
  }, [stage, bgUrl, texts, selectedId]);

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
        const maxW = 1200;
        const maxH = 800;
        const ratio = img.width / img.height;
        let width = Math.min(maxW, img.width);
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
        const copy = {
          ...base,
          id: crypto.randomUUID(),
          x: base.x + 20,
          y: base.y + 20,
        };
        return [...prev, copy];
      });
      pushHistory();
    },
    [pushHistory]
  );

  const selectLayer = useCallback((id: string) => setSelectedId(id), []);

  /* -------- mouse (hit test) -------- */
  const hitTest = useCallback(
    (px: number, py: number): TextNode | null => {
      const c = canvasRef.current!;
      const ctx = c.getContext("2d")!;
      // iterate top-most first
      for (let i = texts.length - 1; i >= 0; i--) {
        const node = texts[i];
        if (!node.visible) continue;
        ctx.font = `${node.fontWeight} ${node.fontSize}px '${node.fontFamily}', Arial, sans-serif`;
        const { x, y, w, h } = getNodeBounds(ctx, node);
        if (px >= x && px <= x + w && py >= y && py <= y + h) {
          return node;
        }
      }
      return null;
    },
    [texts]
  );

  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = hitTest(x, y);
      if (hit) {
        setSelectedId(hit.id);
        if (!hit.locked) {
          dragStartRef.current = {
            pointerX: x,
            pointerY: y,
            nodeX: hit.x,
            nodeY: hit.y,
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

  // *** FIXED: snapshot the ref, don't read it inside setState
  const onCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selectedId) return;

      const drag = dragStartRef.current; // snapshot
      if (!drag) return;

      if (!selectedNode || selectedNode.locked) return;

      const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - drag.pointerX;
      const dy = y - drag.pointerY;

      const nextX = drag.nodeX + dx;
      const nextY = drag.nodeY + dy;

      setTexts((prev) =>
        prev.map((t) => (t.id === selectedId ? { ...t, x: nextX, y: nextY } : t))
      );
    },
    [selectedId, selectedNode]
  );

  const onCanvasMouseUp = useCallback(() => {
    if (dragStartRef.current) pushHistory(false);
    dragStartRef.current = null;
  }, [pushHistory]);

  // Also end drag if mouseup happens outside the canvas
  useEffect(() => {
    const onWinMouseUp = () => {
      if (dragStartRef.current) {
        pushHistory(false);
        dragStartRef.current = null;
      }
    };
    window.addEventListener("mouseup", onWinMouseUp);
    return () => window.removeEventListener("mouseup", onWinMouseUp);
  }, [pushHistory]);

  /* -------- keyboard (HTML canvas, no fabric) -------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
      // duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateSelected();
      }
      // nudge
      const step = e.shiftKey ? 10 : 1;
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp") updateSelected({ y: (selectedNode?.y ?? 0) - step }, false);
        if (e.key === "ArrowDown") updateSelected({ y: (selectedNode?.y ?? 0) + step }, false);
        if (e.key === "ArrowLeft") updateSelected({ x: (selectedNode?.x ?? 0) - step }, false);
        if (e.key === "ArrowRight") updateSelected({ x: (selectedNode?.x ?? 0) + step }, false);
        const c = canvasRef.current;
        if (c) drawAll({ canvas: c, bgImage: bgImageRef.current, bgUrl, nodes: texts, selectedId });
      }
      // undo/redo
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
  }, [selectedId, selectedNode, texts, bgUrl]); // intentionally not including history deps

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
    const c = canvasRef.current;
    if (!c) return;
    exportCanvasPNG(c);
  }, []);

  const reset = useCallback(() => {
    if (!confirm("Reset the canvas? This will clear everything.")) return;
    setBgUrl(null);
    bgImageRef.current = null;
    setTexts([]);
    setSelectedId(null);
    setStage(START_SIZE);
    setHistory([]);
    setHistoryIndex(-1);
    localStorage.removeItem(LS_KEY);
  }, []);

  return {
    // refs
    canvasRef,
    fileInputRef,

    // state
    stage,
    setStage,
    bgUrl,
    texts,
    selectedId,
    selectedNode,
    activePanel,
    setActivePanel,

    // panels & actions
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

    // upload & export
    onFileInputChange,
    exportPNG,
    reset,

    // history
    history,
    historyIndex,
    undo,
    redo,

    // canvas events
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
  };
}
