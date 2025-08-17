"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawAll, exportCanvasPNG } from "@/features/editor/lib/canvas";
import type { SerializableState, StageSize, TextNode } from "@/features/editor/lib/types";

/** Public constants if you need them elsewhere */
export const START_SIZE: StageSize = { width: 960, height: 540 };
export const MAX_HISTORY = 40;

// LocalStorage keys & retention
const LS_STATE_KEY = "itc_canvas_state";
const LS_HISTORY_KEY = "itc_canvas_history";
const LS_HISTORY_IDX_KEY = "itc_canvas_history_i";
const LS_META_KEY = "itc_canvas_meta";
const TEN_MINUTES_MS = 10 * 60 * 1000;
const STORAGE_VERSION = 1;

export function useEditorState() {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

  // Core state
  const [stage, setStage] = useState<StageSize>(START_SIZE);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"text" | "layers" | "history">("text");

  // History
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

      if (saveToLocal) {
        try {
          localStorage.setItem(LS_STATE_KEY, snap);
          localStorage.setItem(LS_META_KEY, JSON.stringify({ ts: Date.now(), v: STORAGE_VERSION }));
        } catch {}
      }
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

  // Initial restore (only if autosave is fresh within 10 minutes)
  useEffect(() => {
    try {
      const metaRaw = localStorage.getItem(LS_META_KEY);
      if (!metaRaw) return;

      const meta = JSON.parse(metaRaw) as { ts: number; v: number };
      if (!meta?.ts || Date.now() - meta.ts > TEN_MINUTES_MS || meta.v !== STORAGE_VERSION) {
        localStorage.removeItem(LS_STATE_KEY);
        localStorage.removeItem(LS_HISTORY_KEY);
        localStorage.removeItem(LS_HISTORY_IDX_KEY);
        localStorage.removeItem(LS_META_KEY);
        return;
      }

      const savedState = localStorage.getItem(LS_STATE_KEY);
      const savedHist = localStorage.getItem(LS_HISTORY_KEY);
      const savedIdx = localStorage.getItem(LS_HISTORY_IDX_KEY);

      if (savedState) restoreFrom(savedState);

      if (savedHist) {
        const arr = JSON.parse(savedHist) as string[];
        setHistory(Array.isArray(arr) ? arr : []);
      } else if (savedState) {
        setHistory([savedState]);
      }

      if (savedIdx != null) {
        const idx = parseInt(savedIdx, 10);
        setHistoryIndex(Number.isFinite(idx) ? idx : savedState ? 0 : -1);
      } else {
        setHistoryIndex(savedState ? 0 : -1);
      }
    } catch {}
  }, [restoreFrom]);

  // Debounced AUTOSAVE of state + history
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const snap = serialize();
        localStorage.setItem(LS_STATE_KEY, snap);
        localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
        localStorage.setItem(LS_HISTORY_IDX_KEY, String(historyIndex));
        localStorage.setItem(LS_META_KEY, JSON.stringify({ ts: Date.now(), v: STORAGE_VERSION }));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [serialize, history, historyIndex, stage, bgUrl, texts]);

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

        // display fit
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
      prev.map((t) => (t.id === selectedId ? { ...t, x: stage.width / 2, y: stage.height / 2 } : t))
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
      const copy: TextNode = { ...base, id: crypto.randomUUID(), x: base.x + 20, y: base.y + 20 };
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
    (srcId: string, destId: string, placeAfter: boolean) => {
      setTexts((prev) => {
        const from = prev.findIndex((t) => t.id === srcId);
        const to = prev.findIndex((t) => t.id === destId);
        if (from < 0 || to < 0 || from === to) return prev;

        const arr = [...prev];
        const [item] = arr.splice(from, 1);

        let insertAt: number;
        if (from < to) {
          const destNow = to - 1;
          insertAt = placeAfter ? destNow + 1 : destNow;
        } else {
          insertAt = placeAfter ? to + 1 : to;
        }

        insertAt = Math.max(0, Math.min(arr.length, insertAt));
        arr.splice(insertAt, 0, item);
        return arr;
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

  /* -------- history ops -------- */
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

  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;
    restoreFrom(history[index]);
    setHistoryIndex(index);
  }, [history, restoreFrom]);

  /* -------- export & reset -------- */
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
    try {
      localStorage.removeItem(LS_STATE_KEY);
      localStorage.removeItem(LS_HISTORY_KEY);
      localStorage.removeItem(LS_HISTORY_IDX_KEY);
      localStorage.removeItem(LS_META_KEY);
    } catch {}
  }, []);

  return {
    // refs
    canvasRef,
    fileInputRef,
    bgImageRef,
    naturalSizeRef,

    // state
    stage, setStage,
    bgUrl, setBgUrl,
    texts, setTexts,
    selectedId, setSelectedId,
    selectedNode,
    activePanel, setActivePanel,

    // actions
    addText,
    updateSelected,
    centerSelected,
    deleteSelected,
    duplicateSelected,

    bringForward,
    sendBackward,
    reorderLayer,
    toggleVisibility,
    toggleLock,
    removeLayer,
    duplicateLayer,
    selectLayer,

    onFileInputChange,
    exportPNG,
    reset,

    // history
    history,
    historyIndex,
    undo,
    redo,
    pushHistory,
    restoreFrom,
    jumpTo,
  };
}
