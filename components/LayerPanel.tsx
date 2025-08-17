"use client";

import React, { useState } from "react";
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
}) => {
  const [dragged, setDragged] = useState<string | null>(null);

  const onDragStart = (id: string) => setDragged(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = () => setDragged(null);

  if (!layers.length) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Layers</h2>
        <div className="text-gray-400 text-sm">No layers yet. Add a text layer to get started.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Layers</h2>

      <div className="space-y-2">
        {layers.map((layer, index) => {
          const isActive = activeId === layer.id;
          const isLocked = layer.locked;
          return (
            <div
              key={layer.id}
              className={`flex items-center p-2 rounded cursor-pointer ${
                isActive ? "bg-blue-900" : "bg-gray-700 hover:bg-gray-600"
              } ${dragged === layer.id ? "opacity-50" : ""}`}
              onClick={() => onSelect(layer.id)}
              draggable
              onDragStart={() => onDragStart(layer.id)}
              onDragOver={onDragOver}
              onDrop={onDrop}
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
                  className="p-1 hover:bg-gray-500 rounded"
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                <button
                  className="p-1 hover:bg-gray-500 rounded"
                  onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                  title={isLocked ? "Unlock Layer" : "Lock Layer"}
                >
                  {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>

                <button
                  className="p-1 hover:bg-gray-500 rounded"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }}
                  title="Duplicate Layer"
                >
                  <Copy size={16} />
                </button>

                <button
                  className="p-1 hover:bg-gray-500 rounded"
                  onClick={(e) => { e.stopPropagation(); onBringForward(layer.id); }}
                  disabled={index === layers.length - 1}
                  title="Bring Forward"
                >
                  <ChevronUp size={16} className={index === layers.length - 1 ? "opacity-50" : ""} />
                </button>

                <button
                  className="p-1 hover:bg-gray-500 rounded"
                  onClick={(e) => { e.stopPropagation(); onSendBackward(layer.id); }}
                  disabled={index === 0}
                  title="Send Backward"
                >
                  <ChevronDown size={16} className={index === 0 ? "opacity-50" : ""} />
                </button>

                <button
                  className="p-1 hover:bg-red-500 rounded"
                  onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }}
                  title="Delete Layer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>Tip: Use the up/down buttons to change layer order.</p>
      </div>
    </div>
  );
};

export default LayerPanel;
