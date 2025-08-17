import React from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  value: number;
  onChangeImmediate: (deg: number) => void;
  onCommit: () => void;
  onReset: () => void;
  ResetIcon: LucideIcon;
};

export const RotationControl: React.FC<Props> = ({
  value, onChangeImmediate, onCommit, onReset, ResetIcon,
}) => {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="space-y-2 pt-2 border-t border-gray-700">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Rotation</label>
        <button
          className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
          title="Reset rotation"
          onClick={onReset}
        >
          <ResetIcon size={14} /> Reset
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={-180}
          max={180}
          value={value}
          onChange={(e) => onChangeImmediate(parseInt(e.target.value, 10))}
          onMouseUp={onCommit}
          className="w-full"
        />
        <div className="flex items-center gap-1">
          <input
            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
            type="number"
            min={-360}
            max={360}
            value={value}
            onChange={(e) => onChangeImmediate(clamp(parseInt(e.target.value || "0", 10), -360, 360))}
            onBlur={onCommit}
          />
          <span className="text-sm">°</span>
        </div>
      </div>
    </div>
  );
};
