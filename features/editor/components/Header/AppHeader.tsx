"use client";

import React from "react";
import { Upload, Download } from "lucide-react";
import HeaderButton from "./HeaderButton";

type Props = {
  onPickFile: () => void;
  onExport: () => void;
};

const AppHeader: React.FC<Props> = ({ onPickFile, onExport }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#1f2937]">
      <h1 className="text-xl font-bold text-white">
        Image Text Composer (Canvas 2D)
      </h1>
      <div className="flex items-center space-x-3">
        <HeaderButton
          label="Upload Image"
          icon={Upload}
          onClick={onPickFile}
          bgColor="bg-blue-600"
          hoverColor="hover:bg-blue-700"
          title="Upload PNG"
        />
        <HeaderButton
          label="Export"
          icon={Download}
          onClick={onExport}
          bgColor="bg-green-600"
          hoverColor="hover:bg-green-700"
          title="Export PNG"
        />
      </div>
    </div>
  );
};

export default AppHeader;
