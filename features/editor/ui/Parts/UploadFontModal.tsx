"use client";

import React, { useEffect, useState } from "react";
import Modal from "../Modal";

type UploadFontModalProps = {
  open: boolean;
  onClose: () => void;
  file: File | null;
  defaultFamily?: string;
  onSubmit: (vals: { family: string; weight: string; style: "normal" | "italic" }) => void | Promise<void>;
  error?: string | null; // external error from parent (e.g., DB failure)
};

const isFontFile = (name?: string) =>
  !!name && /\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(name);

const humanSize = (bytes?: number) =>
  typeof bytes === "number" ? `${(bytes / 1024).toFixed(1)} KB` : "";

const FIELD_CLASS =
  "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white";

const UploadFontModal: React.FC<UploadFontModalProps> = ({
  open,
  onClose,
  file,
  defaultFamily,
  onSubmit,
  error,
}) => {
  const [family, setFamily] = useState(defaultFamily ?? "");
  const [weight, setWeight] = useState("400");
  const [style, setStyle] = useState<"normal" | "italic">("normal");
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opened or file changes
  useEffect(() => {
    if (!open) return;
    setFamily(defaultFamily ?? "");
    setWeight("400");
    setStyle("normal");
    setLocalErr(null);
    setSubmitting(false);
  }, [open, defaultFamily, file]);

  const validate = () => {
    if (!file) return "No file selected.";
    if (!isFontFile(file.name)) return "Please select a TTF, OTF, WOFF, or WOFF2 file.";
    if (!family.trim()) return "Font family is required.";
    if (!/^\d{3}$/.test(weight) && !/^\d{1,4}$/.test(weight)) return "Weight should be a number (e.g. 400, 700).";
    return null;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) {
      setLocalErr(v);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ family: family.trim(), weight, style });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => (submitting ? null : onClose())}
      title="Upload custom font"
      actions={
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      {/* File summary */}
      <div className="mb-3 text-sm text-gray-300">
        {file ? (
          <div>
            <div className="font-medium">{file.name}</div>
            <div className="text-gray-400">
              {file.type || "font file"} · {humanSize(file.size)}
            </div>
          </div>
        ) : (
          <div>No file selected.</div>
        )}
      </div>

      {/* Family */}
      <div className="space-y-1 mb-3">
        <label className="block text-sm">Family</label>
        <input
          className={FIELD_CLASS}
          placeholder="e.g. My Awesome Font"
          value={family}
          onChange={(e) => setFamily(e.target.value)}
        />
      </div>

      {/* Weight + Style */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="space-y-1">
          <label className="block text-sm">Weight</label>
          <input
            className={FIELD_CLASS}
            type="number"
            min={100}
            max={1000}
            step={50}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Style</label>
          <select
            className={FIELD_CLASS}
            value={style}
            onChange={(e) => setStyle(e.target.value as "normal" | "italic")}
          >
            <option value="normal">normal</option>
            <option value="italic">italic</option>
          </select>
        </div>
      </div>

      {/* Errors */}
      {(localErr || error) && (
        <p className="mt-2 text-sm text-red-400">{localErr || error}</p>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Tip: use the same <em>family</em> you want to see in the dropdown. You can add multiple
        weights/styles later by uploading more files with the same family name.
      </p>
    </Modal>
  );
};

export default UploadFontModal;
