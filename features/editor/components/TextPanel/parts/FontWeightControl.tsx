import React from "react";
import type { TextNode } from "@/features/editor/lib/types";

type Props = {
  value: TextNode["fontWeight"];
  onPick: (v: TextNode["fontWeight"]) => void;
};

export const FontWeightControl: React.FC<Props> = ({ value, onPick }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Font Weight</label>
      <select
        value={value}
        onChange={(e) => onPick(e.target.value as TextNode["fontWeight"])}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
      >
        <option value="normal">Normal</option>
        <option value="bold">Bold</option>
      </select>
    </div>
  );
};
