"use client";

import React from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode; // buttons row
  size?: "sm" | "md" | "lg";
};

const sizeMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export default function Modal({
  open,
  title,
  children,
  onClose,
  actions,
  size = "md",
}: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full ${sizeMap[size]} mx-4 rounded-lg bg-gray-800 border border-gray-700 shadow-xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            className="p-1 rounded hover:bg-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3">{children}</div>

        {actions && (
          <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
