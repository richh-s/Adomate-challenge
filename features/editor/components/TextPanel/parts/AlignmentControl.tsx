import React from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { TextNode } from "@/features/editor/lib/types";

type Props = {
  value: TextNode["align"];
  onPick: (v: TextNode["align"]) => void;
};

export const AlignmentControl: React.FC<Props> = ({ value, onPick }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Text Alignment</label>
      <div className="flex space-x-2">
        <button
          className={`flex-1 py-2 rounded ${value === "left" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          onClick={() => onPick("left")}
          title="Left"
        >
          <AlignLeft size={18} className="mx-auto" />
        </button>
        <button
          className={`flex-1 py-2 rounded ${value === "center" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          onClick={() => onPick("center")}
          title="Center"
        >
          <AlignCenter size={18} className="mx-auto" />
        </button>
        <button
          className={`flex-1 py-2 rounded ${value === "right" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          onClick={() => onPick("right")}
          title="Right"
        >
          <AlignRight size={18} className="mx-auto" />
        </button>
      </div>
    </div>
  );
};
