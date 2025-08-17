import React from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  stageWidth: number;
  autoWidth: boolean;
  value: number; // when autoWidth=false
  onToggleAuto: (nextAuto: boolean, nextWidth: number) => void;
  onFitToText: () => void;
  onWide: () => void;
  onChangeImmediate: (w: number) => void;
  onCommit: () => void;
  FitIcon: LucideIcon;
  WideIcon: LucideIcon;
};

export const TextBoxWidthControl: React.FC<Props> = ({
  stageWidth, autoWidth, value, onToggleAuto, onFitToText, onWide,
  onChangeImmediate, onCommit, FitIcon, WideIcon,
}) => {
  const min = 80;
  const max = stageWidth;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Text Box Width</label>
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
            title="Fit to text (no wrapping)"
            onClick={onFitToText}
          >
            <FitIcon size={14} /> Fit to Text
          </button>
          <button
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
            title="Set to canvas width"
            onClick={onWide}
          >
            <WideIcon size={14} /> Wide
          </button>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoWidth}
          onChange={() => {
            const next = !autoWidth;
            const nextWidth = next ? 0 : Math.max(min, value || Math.round(stageWidth * 0.5));
            onToggleAuto(next, nextWidth);
          }}
        />
        <span>Auto width (no wrapping)</span>
      </label>

      {!autoWidth && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={min}
            max={max}
            value={value || min}
            onChange={(e) => onChangeImmediate(parseInt(e.target.value, 10))}
            onMouseUp={onCommit}
            className="w-full"
          />
          <input
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
            type="number"
            min={min}
            max={max}
            value={value || min}
            onChange={(e) => onChangeImmediate(Math.min(max, Math.max(min, parseInt(e.target.value || String(min), 10))))}
            onBlur={onCommit}
          />
          <span className="text-sm text-gray-300">px</span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        When width is set, the text wraps to fit the box. Drag on-canvas side handles to resize.
      </p>
    </div>
  );
};
