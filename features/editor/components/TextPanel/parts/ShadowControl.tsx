"use client";

import React, { useEffect } from "react";
import type { TextNode } from "@/features/editor/lib/types";

type Props = {
  value: TextNode["shadow"];
  onToggle: (next: TextNode["shadow"]) => void;
  onChangeImmediate: (next: TextNode["shadow"]) => void;
  onCommit: () => void;
};

export const ShadowControl: React.FC<Props> = ({
  value, onToggle, onChangeImmediate, onCommit,
}) => {
  useEffect(() => {
    if (!value.enabled) return;

    const vh = window.innerHeight;
    const doc = document;
    const docH = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);

    // Prefer #app-root that we just added in RootLayout
    const appRoot =
      (document.getElementById("app-root") as HTMLElement | null) ??
      (document.getElementById("__next") as HTMLElement | null) ??
      (document.body.firstElementChild as HTMLElement | null);

    const appH = appRoot ? Math.round(appRoot.getBoundingClientRect().height) : null;

    const bodyOverflow = getComputedStyle(document.body).overflow;
    const htmlOverflow = getComputedStyle(document.documentElement).overflow;

    const wouldOverflow = docH > vh;

    // eslint-disable-next-line no-console
    console.warn("[ShadowControl] Shadow enabled → layout status", {
      viewportHeight: vh,
      documentScrollHeight: docH,
      appRootFound: !!appRoot,
      appRootHeight: appH,
      htmlOverflow,
      bodyOverflow,
      wouldOverflow,
      tip:
        "RootLayout uses h-screen + overflow-hidden. Inner rows need min-h-0 and overflow-auto so only panels/canvas scroll.",
    });
  }, [value.enabled]);

  return (
    <div className="space-y-2 pt-2 border-t border-gray-700">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Text Shadow</label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={value.enabled}
            onChange={() => onToggle({ ...value, enabled: !value.enabled })}
          />
          <div className="relative w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-600">
            <div
              className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
                value.enabled ? "translate-x-5" : ""
              }`}
            />
          </div>
        </label>
      </div>

      {value.enabled && (
        <div className="space-y-3 pt-2">
          <div className="space-y-2">
            <label className="block text-xs">Shadow Color</label>
            <div className="flex">
              <input
                type="color"
                value={value.color}
                onChange={(e) => onChangeImmediate({ ...value, color: e.target.value })}
                onBlur={onCommit}
                className="w-10 h-10 rounded overflow-hidden"
              />
              <input
                type="text"
                value={value.color}
                onChange={(e) => onChangeImmediate({ ...value, color: e.target.value })}
                onBlur={onCommit}
                className="ml-2 flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <FieldSlider
            label="Blur"
            min={0}
            max={50}
            value={value.blur}
            onChange={(v) => onChangeImmediate({ ...value, blur: v })}
            onCommit={onCommit}
          />
          <FieldSlider
            label="Offset X"
            min={-50}
            max={50}
            value={value.offsetX}
            onChange={(v) => onChangeImmediate({ ...value, offsetX: v })}
            onCommit={onCommit}
          />
          <FieldSlider
            label="Offset Y"
            min={-50}
            max={50}
            value={value.offsetY}
            onChange={(v) => onChangeImmediate({ ...value, offsetY: v })}
            onCommit={onCommit}
          />
        </div>
      )}
    </div>
  );
};

const FieldSlider: React.FC<{
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}> = ({ label, min, max, value, onChange, onCommit }) => (
  <div className="space-y-1">
    <label className="block text-xs">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        onMouseUp={onCommit}
        className="w-full"
      />
      <span className="text-sm w-10 text-right">{value}</span>
    </div>
  </div>
);

export default ShadowControl;
