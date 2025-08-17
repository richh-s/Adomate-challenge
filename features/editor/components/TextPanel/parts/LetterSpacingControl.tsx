import React from "react";

type Props = {
  value: number;
  onChangeImmediate: (v: number) => void;
  onCommit: () => void;
};

export const LetterSpacingControl: React.FC<Props> = ({ value, onChangeImmediate, onCommit }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Letter Spacing (px)</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={-2}
          max={40}
          step={0.5}
          value={value}
          onChange={(e) => onChangeImmediate(parseFloat(e.target.value))}
          onMouseUp={onCommit}
          className="w-full"
        />
        <input
          className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
          type="number"
          step={0.5}
          value={value}
          onChange={(e) => onChangeImmediate(parseFloat(e.target.value || "0"))}
          onBlur={onCommit}
        />
      </div>
    </div>
  );
};
