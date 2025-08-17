"use client";

import React from "react";
import AppHeader from "@/components/AppHeader";
import TextControls from "@/components/TextControls";
import LayerPanel from "@/components/LayerPanel";
import HistoryPanel from "@/components/HistoryPanel";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
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
    <div className="flex flex-col w-full h-screen bg-gray-800 text-white">
      {/* header now matches canvas area color */}
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

      <div className="flex flex-1 overflow-hidden bg-[#1F2937]">
        {/* side rail with divider */}
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
        {/* properties panel (no background, blends with section) */}
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
          onReorder={editor.reorderLayer} // NEW
        />
          )}

          {editor.activePanel === "history" && (
            <HistoryPanel
              history={editor.history}
              historyIndex={editor.historyIndex}
              onJump={(index) => {
                if (index < 0 || index >= editor.history.length) return;
                const snap = editor.history[index];
                window.localStorage.setItem("itc_canvas_state", snap);
                location.reload();
              }}
            />
          )}
        </div>

        {/* canvas section */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-[#374151]">
          <div
            className="canvas-container bg-transparent"
            style={{ width: editor.stage.width / 1.2, height: editor.stage.height / 1.2 }}
          >
            <canvas
              ref={editor.canvasRef}
              width={editor.stage.width / 1.2}
              height={editor.stage.height / 1.2}
              onMouseDown={editor.onCanvasMouseDown}
              onMouseMove={editor.onCanvasMouseMove}
              onMouseUp={editor.onCanvasMouseUp}
              style={{
                width: editor.stage.width / 1.2,
                height: editor.stage.height / 1.2,
                borderRadius: 8,
                boxShadow: "0 6px 18px rgba(0,0,0,0.20)",
                backgroundColor: "transparent",
                cursor: "default",
              }}
            />
          </div>
        </div>
      </div>

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