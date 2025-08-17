"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import FontSelector from "@/components/FontSelector";
import type { StageSize, TextNode } from "@/lib/types";

type Props = {
  node: TextNode;
  stage: StageSize;
  onChange: (patch: Partial<TextNode>, save?: boolean) => void;
  onCenter: () => void;
};

/**
 * UPDATED TextControls
 * - Adds Rotation controls (angle in degrees).
 * - Adds Text Box Width controls (enables wrapping + resize handles parity).
 * - Small UX tweaks: number inputs next to sliders, "Fit to Text", "Auto width" toggle.
 * - Keeps existing behavior for live updates vs. history commits (save on blur where it matters).
 *
 * NOTE: This expects your TextNode type to include:
 *   - angle?: number   // rotation in degrees (default 0)
 *   - boxWidth?: number | null // px; 0/null => auto (no wrapping)
 */
const TextControls: React.FC<Props> = ({ node, stage, onChange, onCenter }) => {
  const [text, setText] = useState(node.text);
  const [fontSize, setFontSize] = useState(node.fontSize);
  const [fontWeight, setFontWeight] = useState<TextNode["fontWeight"]>(node.fontWeight);
  const [textColor, setTextColor] = useState(node.fill);
  const [opacityPct, setOpacityPct] = useState(Math.round(node.opacity * 100));
  const [align, setAlign] = useState<TextNode["align"]>(node.align);
  const [lineHeight, setLineHeight] = useState(node.lineHeight);
  const [letterSpacing, setLetterSpacing] = useState(node.letterSpacing);
  const [shadow, setShadow] = useState(node.shadow);

  // NEW: rotation + box width (wrapping)
  const initialAngle = typeof node.angle === "number" ? node.angle : 0;
  const [angle, setAngle] = useState<number>(initialAngle);
  const rawBoxWidth = useMemo(
    () => (node.boxWidth == null ? 0 : Math.max(0, Math.round(node.boxWidth))),
    [node.boxWidth]
  );
  const [boxWidth, setBoxWidth] = useState<number>(rawBoxWidth);
  const [autoWidth, setAutoWidth] = useState<boolean>(rawBoxWidth === 0);

  // keep local UI in sync with selected node
  useEffect(() => {
    setText(node.text);
    setFontSize(node.fontSize);
    setFontWeight(node.fontWeight);
    setTextColor(node.fill);
    setOpacityPct(Math.round(node.opacity * 100));
    setAlign(node.align);
    setLineHeight(node.lineHeight);
    setLetterSpacing(node.letterSpacing);
    setShadow(node.shadow);
    setAngle(typeof node.angle === "number" ? node.angle : 0);

    const bw = node.boxWidth == null ? 0 : Math.max(0, Math.round(node.boxWidth));
    setBoxWidth(bw);
    setAutoWidth(bw === 0);
  }, [node]);

  // Stop key events (Backspace/Delete/etc.) from bubbling to global shortcuts
  const stopIfEditable = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    const tag = el?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || el?.isContentEditable) {
      e.stopPropagation();
    }
  };

  const commitText = () => onChange({ text }, true);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="space-y-4" onKeyDownCapture={stopIfEditable}>
      {/* Text Content */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Text Content</label>
        <textarea
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          rows={3}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            // live-update the canvas as you type, but don't push history yet
            onChange({ text: v }, false);
          }}
          onBlur={commitText}
        />
      </div>

      {/* Font Family */}
      <FontSelector value={node.fontFamily} onChange={(font) => onChange({ fontFamily: font })} />

      {/* Font Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Font Size (px)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setFontSize(v);
              onChange({ fontSize: v }, false);
            }}
            onMouseUp={() => onChange({ fontSize }, true)}
            className="w-full"
          />
          <input
            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
            type="number"
            value={fontSize}
            onChange={(e) => {
              const v = clamp(parseInt(e.target.value || "0", 10), 1, 500);
              setFontSize(v);
              onChange({ fontSize: v }, false);
            }}
            onBlur={() => onChange({ fontSize }, true)}
          />
        </div>
      </div>

      {/* Font Weight */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Font Weight</label>
        <select
          value={fontWeight}
          onChange={(e) => {
            const v = e.target.value as TextNode["fontWeight"];
            setFontWeight(v);
            onChange({ fontWeight: v });
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
        </select>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Text Color</label>
        <div className="flex">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              const v = e.target.value;
              setTextColor(v);
              onChange({ fill: v }, false);
            }}
            onBlur={() => onChange({ fill: textColor }, true)}
            className="w-10 h-10 rounded overflow-hidden"
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => {
              const v = e.target.value;
              setTextColor(v);
              onChange({ fill: v }, false);
            }}
            onBlur={() => onChange({ fill: textColor }, true)}
            className="ml-2 flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={opacityPct}
            onChange={(e) => {
              const pct = parseInt(e.target.value, 10);
              setOpacityPct(pct);
              onChange({ opacity: pct / 100 }, false);
            }}
            onMouseUp={() => onChange({ opacity: opacityPct / 100 }, true)}
            className="w-full"
          />
          <span className="text-sm w-12 text-right">{opacityPct}%</span>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Text Alignment</label>
        <div className="flex space-x-2">
          <button
            className={`flex-1 py-2 rounded ${align === "left" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={() => {
              setAlign("left");
              onChange({ align: "left" });
            }}
            title="Left"
          >
            <AlignLeft size={18} className="mx-auto" />
          </button>
          <button
            className={`flex-1 py-2 rounded ${align === "center" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={() => {
              setAlign("center");
              onChange({ align: "center" });
            }}
            title="Center"
          >
            <AlignCenter size={18} className="mx-auto" />
          </button>
          <button
            className={`flex-1 py-2 rounded ${align === "right" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={() => {
              setAlign("right");
              onChange({ align: "right" });
            }}
            title="Right"
          >
            <AlignRight size={18} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Line Height</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={lineHeight}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLineHeight(v);
              onChange({ lineHeight: v }, false);
            }}
            onMouseUp={() => onChange({ lineHeight }, true)}
            className="w-full"
          />
          <input
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
            type="number"
            step={0.05}
            min={0.5}
            max={5}
            value={lineHeight}
            onChange={(e) => {
              const v = clamp(parseFloat(e.target.value || "1"), 0.25, 5);
              setLineHeight(v);
              onChange({ lineHeight: v }, false);
            }}
            onBlur={() => onChange({ lineHeight }, true)}
          />
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Letter Spacing (px)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={-2}
            max={40}
            step={0.5}
            value={letterSpacing}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLetterSpacing(v);
              onChange({ letterSpacing: v }, false);
            }}
            onMouseUp={() => onChange({ letterSpacing }, true)}
            className="w-full"
          />
          <input
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
            type="number"
            step={0.5}
            value={letterSpacing}
            onChange={(e) => {
              const v = parseFloat(e.target.value || "0");
              setLetterSpacing(v);
              onChange({ letterSpacing: v }, false);
            }}
            onBlur={() => onChange({ letterSpacing }, true)}
          />
        </div>
      </div>

      {/* NEW: Rotation */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Rotation</label>
          <button
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
            title="Reset rotation"
            onClick={() => {
              setAngle(0);
              onChange({ angle: 0 });
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={-180}
            max={180}
            value={angle}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setAngle(v);
              onChange({ angle: v }, false);
            }}
            onMouseUp={() => onChange({ angle }, true)}
            className="w-full"
          />
          <div className="flex items-center gap-1">
            <input
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
              type="number"
              min={-360}
              max={360}
              value={angle}
              onChange={(e) => {
                const v = clamp(parseInt(e.target.value || "0", 10), -360, 360);
                setAngle(v);
                onChange({ angle: v }, false);
              }}
              onBlur={() => onChange({ angle }, true)}
            />
            <span className="text-sm">°</span>
          </div>
        </div>
      </div>

      {/* NEW: Text Box Width (wrapping) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Text Box Width</label>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
              title="Fit to text (no wrapping)"
              onClick={() => {
                setAutoWidth(true);
                setBoxWidth(0);
                onChange({ boxWidth: 0 });
              }}
            >
              <Minimize2 size={14} /> Fit to Text
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
              title="Set to canvas width"
              onClick={() => {
                setAutoWidth(false);
                const w = Math.round(stage.width * 0.8);
                setBoxWidth(w);
                onChange({ boxWidth: w });
              }}
            >
              <Maximize2 size={14} /> Wide
            </button>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoWidth}
            onChange={() => {
              const next = !autoWidth;
              setAutoWidth(next);
              if (next) {
                setBoxWidth(0);
                onChange({ boxWidth: 0 });
              } else {
                const w = Math.max(80, boxWidth || Math.round(stage.width * 0.5));
                setBoxWidth(w);
                onChange({ boxWidth: w });
              }
            }}
          />
          <span>Auto width (no wrapping)</span>
        </label>

        {!autoWidth && (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={80}
              max={stage.width}
              value={boxWidth || 80}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setBoxWidth(v);
                onChange({ boxWidth: v }, false);
              }}
              onMouseUp={() => onChange({ boxWidth }, true)}
              className="w-full"
            />
            <input
              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-right"
              type="number"
              min={80}
              max={stage.width}
              value={boxWidth || 80}
              onChange={(e) => {
                const v = clamp(parseInt(e.target.value || "80", 10), 80, stage.width);
                setBoxWidth(v);
                onChange({ boxWidth: v }, false);
              }}
              onBlur={() => onChange({ boxWidth }, true)}
            />
            <span className="text-sm text-gray-300">px</span>
          </div>
        )}
        <p className="text-xs text-gray-400">
          When width is set, the text will wrap to fit the box. Drag the on-canvas side handles to resize.
        </p>
      </div>

      {/* Shadow */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Text Shadow</label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={shadow.enabled}
              onChange={() => {
                const next = { ...shadow, enabled: !shadow.enabled };
                setShadow(next);
                onChange({ shadow: next });
              }}
            />
            <div className="relative w-11 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-600">
              <div
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
                  shadow.enabled ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>
        </div>

        {shadow.enabled && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <label className="block text-xs">Shadow Color</label>
              <div className="flex">
                <input
                  type="color"
                  value={shadow.color}
                  onChange={(e) => {
                    const next = { ...shadow, color: e.target.value };
                    setShadow(next);
                    onChange({ shadow: next }, false);
                  }}
                  onBlur={() => onChange({ shadow }, true)}
                  className="w-10 h-10 rounded overflow-hidden"
                />
                <input
                  type="text"
                  value={shadow.color}
                  onChange={(e) => {
                    const next = { ...shadow, color: e.target.value };
                    setShadow(next);
                    onChange({ shadow: next }, false);
                  }}
                  onBlur={() => onChange({ shadow }, true)}
                  className="ml-2 flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs">Blur</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={shadow.blur}
                  onChange={(e) => {
                    const next = { ...shadow, blur: parseInt(e.target.value, 10) };
                    setShadow(next);
                    onChange({ shadow: next }, false);
                  }}
                  onMouseUp={() => onChange({ shadow }, true)}
                  className="w-full"
                />
                <span className="text-sm w-10 text-right">{shadow.blur}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs">Offset X</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={shadow.offsetX}
                  onChange={(e) => {
                    const next = { ...shadow, offsetX: parseInt(e.target.value, 10) };
                    setShadow(next);
                    onChange({ shadow: next }, false);
                  }}
                  onMouseUp={() => onChange({ shadow }, true)}
                  className="w-full"
                />
                <span className="text-sm w-10 text-right">{shadow.offsetX}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs">Offset Y</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={shadow.offsetY}
                  onChange={(e) => {
                    const next = { ...shadow, offsetY: parseInt(e.target.value, 10) };
                    setShadow(next);
                    onChange({ shadow: next }, false);
                  }}
                  onMouseUp={() => onChange({ shadow }, true)}
                  className="w-full"
                />
                <span className="text-sm w-10 text-right">{shadow.offsetY}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2">
        <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded" onClick={onCenter}>
          Center on Canvas ({stage.width}×{stage.height})
        </button>
      </div>
    </div>
  );
};

export default TextControls;
