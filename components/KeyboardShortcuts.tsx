"use client";

import { useEffect } from "react";

type Props = {
  onDelete: () => void;
  onDuplicate: () => void;
  onNudge: (dx: number, dy: number, save?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
};

const KeyboardShortcuts: React.FC<Props> = ({
  onDelete,
  onDuplicate,
  onNudge,
  onUndo,
  onRedo,
  hasSelection,
}) => {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if ((e.key === "Delete" || e.key === "Backspace") && hasSelection) {
        e.preventDefault();
        onDelete();
      }
      if (mod && e.key.toLowerCase() === "d" && hasSelection) {
        e.preventDefault();
        onDuplicate();
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && hasSelection) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowUp") onNudge(0, -step, false);
        if (e.key === "ArrowDown") onNudge(0, step, false);
        if (e.key === "ArrowLeft") onNudge(-step, 0, false);
        if (e.key === "ArrowRight") onNudge(step, 0, false);
      }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? onRedo() : onUndo();
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [hasSelection, onDelete, onDuplicate, onNudge, onUndo, onRedo]);

  return null;
};

export default KeyboardShortcuts;
