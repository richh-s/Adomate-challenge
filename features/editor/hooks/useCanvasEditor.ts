"use client";

import { useEffect } from "react";
import { drawAll } from "@/features/editor/lib/canvas";
import type { TextNode } from "@/features/editor/lib/types";
import { useEditorState } from "./useEditorState";
import { useCanvasInteractions } from "./useCanvasInteractions";

/**
 * useCanvasEditor
 *
 * Thin orchestration hook that:
 *  - pulls editor state/actions from useEditorState()
 *  - wires up pointer interactions from useCanvasInteractions()
 *  - triggers re-renders on canvas when relevant state changes
 *  - installs global keyboard shortcuts (Delete/Duplicate/Nudge/Undo/Redo)
 *
 * NOTE ON EXPORT:
 *  - The exported PNG keeps the ORIGINAL image dimensions (no downscaling).
 *    This is implemented inside useEditorState().exportPNG, which renders to an
 *    offscreen canvas sized to the image's natural size and draws the composition
 *    at 1:1 scale before saving.
 */
export function useCanvasEditor() {
  // Central app state for canvas, background image, text layers, history, etc.
  const state = useEditorState();

  const {
    // refs
    canvasRef,
    bgImageRef,

    // stage + composition model
    stage,
    bgUrl,
    texts,
    selectedId,
    selectedNode,

    // actions (text layers & selection)
    addText,
    updateSelected,
    centerSelected,
    deleteSelected,
    duplicateSelected,

    // z-order & layer operations
    bringForward,
    sendBackward,
    reorderLayer,
    toggleVisibility,
    toggleLock,
    removeLayer,
    duplicateLayer,
    selectLayer,

    // upload & export & reset
    onFileInputChange,
    exportPNG, // <-- Exposed export function that preserves ORIGINAL dimensions
    reset,

    // history
    history,
    historyIndex,
    undo,
    redo,
    pushHistory,
  } = state;

  // Pointer interactions (hit-testing, drag/move/resize/rotate, snap guides)
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

  /**
   * Redraw canvas whenever paint-relevant inputs change.
   * This is the only place we call drawAll() directly in this hook.
   */
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
  }, [
    canvasRef,
    bgImageRef,
    bgUrl,
    texts,
    selectedId,
    interactions.snapGuides, // snap guides appear/disappear during drag
  ]);

  /**
   * Global keyboard shortcuts:
   * - Delete/Backspace: delete selection
   * - Cmd/Ctrl + D:     duplicate selection
   * - Arrow / Shift+Arrow: nudge by 1px / 10px
   * - Cmd/Ctrl + Z:     undo (Shift adds redo)
   * - Cmd/Ctrl + Y:     redo
   *
   * Important: We rely on the page-level KeyboardShortcuts component to
   * suppress handling when focus is in an input/textarea; this handler is a
   * second line of defense to keep interactions snappy on the canvas itself.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Delete selection
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }

      // Duplicate selection
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateSelected();
      }

      // Nudge selection with arrow keys (Shift = 10px)
      const step = e.shiftKey ? 10 : 1;
      if (
        selectedId &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        if (e.key === "ArrowUp")
          updateSelected({ y: (selectedNode?.y ?? 0) - step }, false);
        if (e.key === "ArrowDown")
          updateSelected({ y: (selectedNode?.y ?? 0) + step }, false);
        if (e.key === "ArrowLeft")
          updateSelected({ x: (selectedNode?.x ?? 0) - step }, false);
        if (e.key === "ArrowRight")
          updateSelected({ x: (selectedNode?.x ?? 0) + step }, false);

        // Immediate redraw so movement feels live without pushing history
        interactions.redraw();
      }

      // Undo / Redo
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
  }, [
    selectedId,
    selectedNode,
    updateSelected,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    interactions,
  ]);

  /**
   * Public API returned by the hook.
   * Keep this shape stable since the page and panels rely on it.
   */
  return {
    // refs (canvas + file input)
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

    // text/layer operations
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

    // upload & export & reset
    onFileInputChange,
    exportPNG, // <-- Exports a PNG at ORIGINAL image dimensions (no scaling)
    reset,

    // history
    history,
    historyIndex,
    undo,
    redo,
    jumpTo: state.jumpTo,

    // canvas pointer events
    onCanvasMouseDown: interactions.onCanvasMouseDown,
    onCanvasMouseMove: interactions.onCanvasMouseMove,
    onCanvasMouseUp: interactions.onCanvasMouseUp,
  };
}
