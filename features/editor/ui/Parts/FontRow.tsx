"use client";

import React from "react";
import { Trash2 } from "lucide-react";

type Props = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
  fontFamily?: string;
};

export default function FontRow({
  label,
  isSelected,
  onClick,
  showDelete,
  onDelete,
  fontFamily,
}: Props) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        className={`flex-1 text-left px-3 py-2 hover:bg-gray-700 ${isSelected ? "bg-gray-700/70" : ""}`}
        style={{ fontFamily: fontFamily ? `"${fontFamily}", inherit` : undefined }}
        onClick={onClick}
      >
        {label}
      </button>
      {showDelete && onDelete && (
        <button
          className="px-2 text-gray-300 hover:text-red-400"
          title="Remove custom font"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
