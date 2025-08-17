import React from "react";

type Props = {
  value: string;
  onChangeImmediate: (v: string) => void;
  onCommit: () => void;
};

export const TextContent: React.FC<Props> = ({ value, onChangeImmediate, onCommit }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Text Content</label>
      <textarea
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        rows={3}
        value={value}
        onChange={(e) => onChangeImmediate(e.target.value)}
        onBlur={onCommit}
      />
    </div>
  );
};
