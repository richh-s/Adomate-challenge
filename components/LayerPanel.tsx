"use client";

import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Copy, Lock, Unlock } from "lucide-react";
import type { TextNode } from "@/lib/types";

type Props = {
  layers: TextNode[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorder: (srcId: string, destId: string) => void;
};

const LayerPanel: React.FC<Props> = ({
  layers,
  activeId,
  onSelect,
  onBringForward,
  onSendBackward,
  onDuplicate,
  onRemove,
  onToggleVisibility,
  onToggleLock,
  onReorder,
}) => {
  const [dragged, setDragged] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const visibleLayers = useMemo(
    () => layers.filter((l) => l.visible && l.text.trim().length > 0),
    [layers]
  );
  const hiddenLayers = useMemo(
    () => layers.filter((l) => !l.visible || l.text.trim().length === 0),
    [layers]
  );

  const isTopInAll = (id: string) => layers.findIndex((l) => l.id === id) === layers.length - 1;
  const isBottomInAll = (id: string) => layers.findIndex((l) => l.id === id) === 0;

  const onDragStart = (id: string) => setDragged(id);
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== overId) setOverId(id);
  };
  const onDrop = (id: string) => {
    if (dragged && dragged !== id) onReorder(dragged, id);
    setDragged(null);
    setOverId(null);
  };

  const renderRow = (layer: TextNode) => {
    const isActive = activeId === layer.id;
    const isLocked = layer.locked;
    const isOver = overId === layer.id;

    return (
      <div
        key={layer.id}
        className={`flex items-center p-2 rounded cursor-pointer ${
          isActive ? "bg-blue-900" : "bg-gray-700 hover:bg-gray-600"
        } ${dragged === layer.id ? "opacity-50" : ""} ${isOver ? "ring-2 ring-purple-400" : ""}`}
        onClick={() => onSelect(layer.id)}
        draggable
        onDragStart={() => onDragStart(layer.id)}
        onDragOver={(e) => onDragOver(e, layer.id)}
        onDrop={() => onDrop(layer.id)}
        title={layer.text}
      >
        <div className="flex-1 min-w-0">
          <div className="truncate">{layer.text || "Text Layer"}</div>
          <div className="text-xs text-gray-300 truncate">
            {layer.fontFamily}, {layer.fontSize}px
          </div>
        </div>

        <div className="flex space-x-1">
          <button
            type="button"
            className="p-1 hover:bg-gray-500 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(layer.id);
            }}
            title={layer.visible ? "Hide Layer" : "Show Layer"}
          >
            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button
            type="button"
            className="p-1 hover:bg-gray-500 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(layer.id);
            }}
            title={isLocked ? "Unlock Layer" : "Lock Layer"}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          <button
            type="button"
            className="p-1 hover:bg-gray-500 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(layer.id);
            }}
            title="Duplicate Layer"
          >
            <Copy size={16} />
          </button>

          <button
            type="button"
            className="p-1 hover:bg-gray-500 rounded disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onBringForward(layer.id);
            }}
            disabled={isTopInAll(layer.id)}
            title="Bring Forward"
            aria-disabled={isTopInAll(layer.id)}
          >
            <ChevronUp size={16} />
          </button>

          <button
            type="button"
            className="p-1 hover:bg-gray-500 rounded disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onSendBackward(layer.id);
            }}
            disabled={isBottomInAll(layer.id)}
            title="Send Backward"
            aria-disabled={isBottomInAll(layer.id)}
          >
            <ChevronDown size={16} />
          </button>

          <button
            type="button"
            className="p-1 hover:bg-red-500 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(layer.id);
            }}
            title="Delete Layer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (layers.length === 0) return null;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Layers</h2>

        {hiddenLayers.length > 0 && (
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
            onClick={() => setShowHidden((v) => !v)}
            title={showHidden ? "Hide hidden layers" : "Show hidden layers"}
          >
            {showHidden ? "Hide hidden" : `Show hidden (${hiddenLayers.length})`}
          </button>
        )}
      </div>

      {visibleLayers.length > 0 ? (
        <div className="space-y-2">{visibleLayers.map(renderRow)}</div>
      ) : (
        <div className="text-sm text-gray-400 mb-2">No visible text layers.</div>
      )}

      {showHidden && hiddenLayers.length > 0 && (
        <>
          <div className="mt-4 mb-2 text-xs uppercase tracking-wide text-gray-400">
            Hidden / Empty
          </div>
          <div className="space-y-2 opacity-80">{hiddenLayers.map(renderRow)}</div>
        </>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>Tip: Drag a row to reorder layers.</p>
      </div>
    </div>
  );
};

export default LayerPanel;
