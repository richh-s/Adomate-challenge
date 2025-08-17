"use client";

import React from "react";
import Modal from "./Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fontFamily?: string;
};

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  fontFamily,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove custom font"
      size="sm"
      actions={
        <>
          <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            Remove
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-200">
        Are you sure you want to remove <span className="font-semibold">{fontFamily}</span> from your browser?
      </p>
    </Modal>
  );
}
