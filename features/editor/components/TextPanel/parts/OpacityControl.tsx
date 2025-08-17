import React from "react";

type Props = {
  valuePct: number; // 0..100
  onChangeImmediate: (pct: number) => void;
  onCommit: () => void;
};

export const OpacityControl: React.FC<Props> = ({ valuePct, onChangeImmediate, onCommit }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Opacity</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={valuePct}
          onChange={(e) => onChangeImmediate(parseInt(e.target.value, 10))}
          onMouseUp={onCommit}
          className="w-full"
        />
        <span className="text-sm w-12 text-right">{valuePct}%</span>
      </div>
    </div>
  );
};
