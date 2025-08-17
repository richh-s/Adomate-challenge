import React from "react";

type Props = {
  value: number;
  onChangeImmediate: (v: number) => void;
  onCommit: () => void;
};

export const LineHeightControl: React.FC<Props> = ({ value, onChangeImmediate, onCommit }) => {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Line Height</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={value}
          onChange={(e) => onChangeImmediate(parseFloat(e.target.value))}
          onMouseUp={onCommit}
          className="w-full"
        />
        <input
          className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
          type="number"
          step={0.05}
          min={0.5}
          max={5}
          value={value}
          onChange={(e) => onChangeImmediate(clamp(parseFloat(e.target.value || "1"), 0.25, 5))}
          onBlur={onCommit}
        />
      </div>
    </div>
  );
};
