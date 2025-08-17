"use client";

import { useEffect } from "react";
import { drawAll } from "@/features/editor/lib/canvas";
import type { TextNode } from "@/features/editor/lib/types";
import { useEditorState } from "./useEditorState";
import { useCanvasInteractions } from "./useCanvasInteractions";

export function useCanvasEditor() {
  const state = useEditorState();

  const {
    canvasRef, bgImageRef, stage, bgUrl, texts, selectedId, selectedNode,
    addText, updateSelected, centerSelected, deleteSelected, duplicateSelected,
    bringForward, sendBackward, reorderLayer, toggleVisibility, toggleLock,
    removeLayer, duplicateLayer, selectLayer, onFileInputChange, exportPNG, reset,
    history, historyIndex, undo, redo, pushHistory,
  } = state;

  const interactions = useCanvasInteractions({
    canvasRef,
    bgImageRef,
    stageWidth: stage.width,
    bgUrl,
    texts,
    setTexts: state.setTexts,
    selectedId,
    setSelectedId: state.setSelectedId,
    selectedNode,
    pushHistory,
  });

  // Redraw on canvas-relevant changes (central place)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    drawAll({
      canvas: c,
      bgImage: bgImageRef.current,
      bgUrl,
      nodes: texts,
      selectedId,
      snapGuides: interactions.snapGuides,
    });
  }, [canvasRef, bgImageRef, bgUrl, texts, selectedId, interactions.snapGuides]);

  // Keyboard shortcuts (delete/duplicate/nudge/undo/redo)
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
        interactions.redraw();
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
  }, [selectedId, selectedNode, updateSelected, deleteSelected, duplicateSelected, undo, redo, interactions]);

  // Return the same API shape you already use elsewhere
  return {
    // refs
    canvasRef: state.canvasRef,
    fileInputRef: state.fileInputRef,

    // state
    stage: state.stage,
    setStage: state.setStage,
    bgUrl: state.bgUrl,
    texts: state.texts,
    selectedId: state.selectedId,
    selectedNode: state.selectedNode,
    activePanel: state.activePanel,
    setActivePanel: state.setActivePanel,

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
    reorderLayer,

    // upload & export
    onFileInputChange,
    exportPNG,
    reset,

    // history
    history,
    historyIndex,
    undo,
    redo,
    jumpTo: state.jumpTo,

    // canvas events
    onCanvasMouseDown: interactions.onCanvasMouseDown,
    onCanvasMouseMove: interactions.onCanvasMouseMove,
    onCanvasMouseUp: interactions.onCanvasMouseUp,
  };
}
