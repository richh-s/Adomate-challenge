import React from "react";

type Props = {
  value: number;
  onChangeImmediate: (v: number) => void;
  onCommit: () => void;
};

export const FontSizeControl: React.FC<Props> = ({ value, onChangeImmediate, onCommit }) => {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Font Size (px)</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={8}
          max={200}
          value={value}
          onChange={(e) => onChangeImmediate(parseInt(e.target.value, 10))}
          onMouseUp={onCommit}
          className="w-full"
        />
        <input
          className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
          type="number"
          value={value}
          onChange={(e) => onChangeImmediate(clamp(parseInt(e.target.value || "0", 10), 1, 500))}
          onBlur={onCommit}
        />
      </div>
    </div>
  );
};
