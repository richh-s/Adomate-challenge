import React from "react";

type Props = {
  value: string;
  onChangeImmediate: (v: string) => void;
  onCommit: () => void;
};

export const ColorControl: React.FC<Props> = ({ value, onChangeImmediate, onCommit }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Text Color</label>
      <div className="flex">
        <input
          type="color"
          value={value}
          onChange={(e) => onChangeImmediate(e.target.value)}
          onBlur={onCommit}
          className="w-10 h-10 rounded overflow-hidden"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeImmediate(e.target.value)}
          onBlur={onCommit}
          className="ml-2 flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
    </div>
  );
};
