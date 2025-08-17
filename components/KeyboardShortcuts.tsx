"use client";

import React, { useCallback, useEffect } from "react";

type Props = {
  onDelete: () => void;
  onDuplicate: () => void;
  onNudge: (dx: number, dy: number, save?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

const KeyboardShortcuts: React.FC<Props> = ({
  onDelete,
  onDuplicate,
  onNudge,
  onUndo,
  onRedo,
  hasSelection,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don’t handle shortcuts while typing in inputs/textarea/contenteditable
      if (isEditableTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;

      // delete / backspace
      if ((e.key === "Delete" || e.key === "Backspace") && hasSelection) {
        e.preventDefault();
        onDelete();
        return;
      }

      // duplicate: Cmd/Ctrl + D
      if (mod && e.key.toLowerCase() === "d" && hasSelection) {
        e.preventDefault();
        onDuplicate();
        return;
      }

      // nudging with arrow keys (Shift = 10px)
      if (
        hasSelection &&
        (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowUp") onNudge(0, -step, false);
        else if (e.key === "ArrowDown") onNudge(0, step, false);
        else if (e.key === "ArrowLeft") onNudge(-step, 0, false);
        else if (e.key === "ArrowRight") onNudge(step, 0, false);
        return;
      }

      // undo / redo
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
      }
    },
    [hasSelection, onDelete, onDuplicate, onNudge, onUndo, onRedo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
};

export default KeyboardShortcuts;
