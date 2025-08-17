"use client";

import React from "react";
import { Search, Upload } from "lucide-react";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  onUploadClick: () => void;
};

export default function SearchBar({ query, setQuery, onUploadClick }: Props) {
  return (
    <div className="sticky top-0 flex items-center gap-2 bg-gray-800 p-2 border-b border-gray-700">
      <Search size={16} className="opacity-70" />
      <input
        className="w-full bg-transparent outline-none text-sm"
        placeholder="Search fonts…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        type="button"
        className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
        onClick={onUploadClick}
        title="Upload custom font"
      >
        <Upload size={14} /> Upload
      </button>
    </div>
  );
}
