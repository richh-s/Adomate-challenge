"use client";

import React, { useEffect, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import FontSelector from "@/components/FontSelector";
import type { StageSize, TextNode } from "@/lib/types";

type Props = {
  node: TextNode;
  stage: StageSize;
  onChange: (patch: Partial<TextNode>, save?: boolean) => void;
  onCenter: () => void;
};

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
  }, [node]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Text Content</label>
        <textarea
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          rows={3}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange({ text: e.target.value }, false);
          }}
          onBlur={() => onChange({ text }, true)}
        />
      </div>

      <FontSelector value={node.fontFamily} onChange={(font) => onChange({ fontFamily: font })} />

      <div className="space-y-2">
        <label className="block text-sm font-medium">Font Size</label>
        <div className="flex items-center">
          <input
            type="range"
            min={8}
            max={120}
            value={fontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setFontSize(v);
              onChange({ fontSize: v });
            }}
            className="w-full mr-2"
          />
          <span className="text-sm w-10 text-right">{fontSize}</span>
        </div>
      </div>

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

      <div className="space-y-2">
        <label className="block text-sm font-medium">Text Color</label>
        <div className="flex">
          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              onChange({ fill: e.target.value });
            }}
            className="w-10 h-10 rounded overflow-hidden"
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              onChange({ fill: e.target.value });
            }}
            className="ml-2 flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Opacity</label>
        <div className="flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={opacityPct}
            onChange={(e) => {
              const pct = parseInt(e.target.value, 10);
              setOpacityPct(pct);
              onChange({ opacity: pct / 100 });
            }}
            className="w-full mr-2"
          />
          <span className="text-sm w-10 text-right">{opacityPct}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Text Alignment</label>
        <div className="flex space-x-2">
          <button
            className={`flex-1 py-2 rounded ${align === "left" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={() => {
              setAlign("left");
              onChange({ align: "left" });
            }}
          >
            <AlignLeft size={18} className="mx-auto" />
          </button>
          <button
            className={`flex-1 py-2 rounded ${align === "center" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={() => {
              setAlign("center");
              onChange({ align: "center" });
            }}
          >
            <AlignCenter size={18} className="mx-auto" />
          </button>
          <button
            className={`flex-1 py-2 rounded ${align === "right" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            onClick={() => {
              setAlign("right");
              onChange({ align: "right" });
            }}
          >
            <AlignRight size={18} className="mx-auto" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Line Height</label>
        <div className="flex items-center">
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={lineHeight}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLineHeight(v);
              onChange({ lineHeight: v });
            }}
            className="w-full mr-2"
          />
          <span className="text-sm w-14 text-right">{lineHeight.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Letter Spacing</label>
        <div className="flex items-center">
          <input
            type="range"
            min={-2}
            max={20}
            step={0.5}
            value={letterSpacing}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLetterSpacing(v);
              onChange({ letterSpacing: v });
            }}
            className="w-full mr-2"
          />
          <span className="text-sm w-12 text-right">{letterSpacing.toFixed(1)}</span>
        </div>
      </div>

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
              <div className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform ${shadow.enabled ? "translate-x-5" : ""}`} />
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
                    onChange({ shadow: next });
                  }}
                  className="w-10 h-10 rounded overflow-hidden"
                />
                <input
                  type="text"
                  value={shadow.color}
                  onChange={(e) => {
                    const next = { ...shadow, color: e.target.value };
                    setShadow(next);
                    onChange({ shadow: next });
                  }}
                  className="ml-2 flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs">Blur</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={shadow.blur}
                  onChange={(e) => {
                    const next = { ...shadow, blur: parseInt(e.target.value, 10) };
                    setShadow(next);
                    onChange({ shadow: next });
                  }}
                  className="w-full mr-2"
                />
                <span className="text-sm w-10 text-right">{shadow.blur}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs">Offset X</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={shadow.offsetX}
                  onChange={(e) => {
                    const next = { ...shadow, offsetX: parseInt(e.target.value, 10) };
                    setShadow(next);
                    onChange({ shadow: next });
                  }}
                  className="w-full mr-2"
                />
                <span className="text-sm w-10 text-right">{shadow.offsetX}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs">Offset Y</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={shadow.offsetY}
                  onChange={(e) => {
                    const next = { ...shadow, offsetY: parseInt(e.target.value, 10) };
                    setShadow(next);
                    onChange({ shadow: next });
                  }}
                  className="w-full mr-2"
                />
                <span className="text-sm w-10 text-right">{shadow.offsetY}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded" onClick={onCenter}>
          Center on Canvas ({stage.width}×{stage.height})
        </button>
      </div>
    </div>
  );
};

export default TextControls;
