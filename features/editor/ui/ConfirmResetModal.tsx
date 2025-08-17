"use client";

import React from "react";
import Modal from "./Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmResetModal({ open, onClose, onConfirm }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset canvas?"
      size="sm"
      actions={
        <>
          <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600" onClick={onClose}>
            Cancel
          </button>
          <button className="px-3 py-2 rounded bg-red-600 hover:bg-red-700" onClick={onConfirm}>
            Reset
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-200">
        This will clear the background, all text layers, and history. This can’t be undone.
      </p>
    </Modal>
  );
}
