"use client";

import React from "react";
import AppHeader from "@/features/editor/components/Header/AppHeader";
import TextControls from "@/features/editor/components/TextPanel/page";
import LayerPanel from "@/features/editor/components/Panels/LayerPanel";
import HistoryPanel from "@/features/editor/components/Panels/HistoryPanel";
import KeyboardShortcuts from "@/features/editor/components/KeyboardShortcuts";
import CanvasStage from "@/features/editor/components/CanvasStage/CanvasStage";
import { useCanvasEditor } from "@/features/editor/hooks/useCanvasEditor";
import {
  Type as TypeIcon,
  Layers as LayersIcon,
  History as HistoryIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Trash as TrashIcon,
} from "lucide-react";

export default function Page() {
  const editor = useCanvasEditor();

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-gray-800 text-white">
      {/* Header */}
      <AppHeader
        onPickFile={() => editor.fileInputRef.current?.click()}
        onExport={editor.exportPNG}
      />

      <input
        ref={editor.fileInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={editor.onFileInputChange}
      />

      {/* Main row */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-[#1F2937]">
        {/* Side rail */}
        <div className="w-12 flex flex-col items-center py-4 border-r border-[#374151]">
          <button
            className={`p-2 mb-4 rounded ${
              editor.activePanel === "text" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
            onClick={() => editor.setActivePanel("text")}
            title="Text Tools"
          >
            <TypeIcon size={20} />
          </button>
          <button
            className={`p-2 mb-4 rounded ${
              editor.activePanel === "layers" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
            onClick={() => editor.setActivePanel("layers")}
            title="Layers"
          >
            <LayersIcon size={20} />
          </button>
          <button
            className={`p-2 mb-4 rounded ${
              editor.activePanel === "history" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
            onClick={() => editor.setActivePanel("history")}
            title="History"
          >
            <HistoryIcon size={20} />
          </button>

          <div className="mt-auto flex flex-col items-center">
            <button
              className="p-2 mb-2 rounded hover:bg-gray-700 disabled:opacity-50"
              onClick={editor.undo}
              disabled={editor.historyIndex <= 0}
              title="Undo"
            >
              <UndoIcon size={20} />
            </button>
            <button
              className="p-2 mb-2 rounded hover:bg-gray-700 disabled:opacity-50"
              onClick={editor.redo}
              disabled={editor.historyIndex >= editor.history.length - 1}
              title="Redo"
            >
              <RedoIcon size={20} />
            </button>
            <button
              className="p-2 rounded text-red-400 hover:bg-gray-700"
              onClick={editor.reset}
              title="Reset Canvas"
            >
              <TrashIcon size={20} />
            </button>
          </div>
        </div>

        {/* Properties / Panels (scrollable) */}
        <div className="w-64 overflow-y-auto bg-[#1F2937]">
          {editor.activePanel === "text" && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Text Properties</h2>
              <button
                className="w-full py-2 mb-4 bg-blue-600 hover:bg-blue-700 rounded"
                onClick={editor.addText}
              >
                Add Text Layer
              </button>

              {editor.selectedNode ? (
                <TextControls
                  node={editor.selectedNode}
                  stage={editor.stage}
                  onChange={editor.updateSelected}
                  onCenter={editor.centerSelected}
                />
              ) : (
                <div className="text-gray-400 text-sm">
                  Select a text layer to edit its properties
                </div>
              )}
            </div>
          )}

          {editor.activePanel === "layers" && (
            <LayerPanel
              layers={editor.texts}
              activeId={editor.selectedId}
              onSelect={editor.selectLayer}
              onBringForward={editor.bringForward}
              onSendBackward={editor.sendBackward}
              onDuplicate={editor.duplicateLayer}
              onRemove={editor.removeLayer}
              onToggleVisibility={editor.toggleVisibility}
              onToggleLock={editor.toggleLock}
              onReorder={editor.reorderLayer}
            />
          )}

          {editor.activePanel === "history" && (
            <HistoryPanel
              history={editor.history}
              historyIndex={editor.historyIndex}
              onJump={editor.jumpTo}
            />
          )}
        </div>

        {/* Canvas section (scrollable area) */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto p-4 bg-[#374151]">
          <CanvasStage
            stage={editor.stage}
            canvasRef={editor.canvasRef}
            onMouseDown={editor.onCanvasMouseDown}
            onMouseMove={editor.onCanvasMouseMove}
            onMouseUp={editor.onCanvasMouseUp}
            displayScale={0.833333}
            className="canvas-container bg-transparent"
          />
        </div>
      </div>

      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts
        hasSelection={!!editor.selectedId}
        onDelete={editor.deleteSelected}
        onDuplicate={editor.duplicateSelected}
        onNudge={(dx, dy, save) => {
          if (!editor.selectedId || !editor.selectedNode) return;
          editor.updateSelected(
            { x: editor.selectedNode.x + dx, y: editor.selectedNode.y + dy },
            save
          );
        }}
        onUndo={editor.undo}
        onRedo={editor.redo}
      />
    </div>
  );
}
