"use client";

import React from "react";
import { Upload, Download } from "lucide-react";

type Props = {
  onPickFile: () => void;
  onExport: () => void;
};

const AppHeader: React.FC<Props> = ({ onPickFile, onExport }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#1f2937]">
      <h1 className="text-xl font-bold">Image Text Composer (Canvas 2D)</h1>
      <div className="flex items-center space-x-3">
        <button
          className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          onClick={onPickFile}
          title="Upload PNG"
        >
          <Upload size={16} className="mr-1" />
          Upload Image
        </button>

        <button
          className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
          onClick={onExport}
          title="Export PNG"
        >
          <Download size={16} className="mr-1" />
          Export
        </button>
      </div>
    </div>
  );
};

export default AppHeader;