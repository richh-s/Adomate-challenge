"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import FontSelector from "@/features/editor/ui/FontSelector";
import type { StageSize, TextNode } from "@/features/editor/lib/types";

// Subcomponents
import { TextContent } from "./parts/TextContent";
import { FontFamilyControl } from "./parts/FontFamilyControl";
import { FontSizeControl } from "./parts/FontSizeControl";
import { FontWeightControl } from "./parts/FontWeightControl";
import { ColorControl } from "./parts/ColorControl";
import { OpacityControl } from "./parts/OpacityControl";
import { AlignmentControl } from "./parts/AlignmentControl";
import { LineHeightControl } from "./parts/LineHeightControl";
import { LetterSpacingControl } from "./parts/LetterSpacingControl";
import { RotationControl } from "./parts/RotationControl";
import { TextBoxWidthControl } from "./parts/TextBoxWidthControl";
import { ShadowControl } from "./parts/ShadowControl";
import { ActionsBar } from "./parts/ActionsBar";

/**
 * IMPORTANT PERFORMANCE PATTERN
 * - We "live-update" the canvas while the user drags sliders/types (save=false)
 * - We "commit" changes on blur/mouseup (save=true) to push a single history step
 */
type Props = {
  node: TextNode;
  stage: StageSize;
  onChange: (patch: Partial<TextNode>, save?: boolean) => void;
  onCenter: () => void;
};

export const TextControls: React.FC<Props> = ({ node, stage, onChange, onCenter }) => {
  // Local UI mirrors so slider/inputs feel instant without spamming history.
  const [text, setText] = useState(node.text);
  const [fontSize, setFontSize] = useState(node.fontSize);
  const [fontWeight, setFontWeight] = useState<TextNode["fontWeight"]>(node.fontWeight);
  const [textColor, setTextColor] = useState(node.fill);
  const [opacityPct, setOpacityPct] = useState(Math.round(node.opacity * 100));
  const [align, setAlign] = useState<TextNode["align"]>(node.align);
  const [lineHeight, setLineHeight] = useState(node.lineHeight);
  const [letterSpacing, setLetterSpacing] = useState(node.letterSpacing);
  const [shadow, setShadow] = useState(node.shadow);

  const initialAngle = typeof node.angle === "number" ? node.angle : 0;
  const [angle, setAngle] = useState<number>(initialAngle);

  const rawBoxWidth = useMemo(
    () => (node.boxWidth == null ? 0 : Math.max(0, Math.round(node.boxWidth))),
    [node.boxWidth]
  );
  const [boxWidth, setBoxWidth] = useState<number>(rawBoxWidth);
  const [autoWidth, setAutoWidth] = useState<boolean>(rawBoxWidth === 0);

  // Keep local state in sync when the selection changes
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

  // Prevent global shortcuts while typing
  const stopIfEditable = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    const tag = el?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || el?.isContentEditable) e.stopPropagation();
  };

  return (
    <div className="space-y-4" onKeyDownCapture={stopIfEditable}>
      <TextContent
        value={text}
        onChangeImmediate={(v) => {
          setText(v);
          onChange({ text: v }, false);
        }}
        onCommit={() => onChange({ text }, true)}
      />

      <FontFamilyControl
        value={node.fontFamily}
        onPick={(font) => onChange({ fontFamily: font })}
      />

      <FontSizeControl
        value={fontSize}
        onChangeImmediate={(v) => {
          setFontSize(v);
          onChange({ fontSize: v }, false);
        }}
        onCommit={() => onChange({ fontSize }, true)}
      />

      <FontWeightControl
        value={fontWeight}
        onPick={(v) => {
          setFontWeight(v);
          onChange({ fontWeight: v });
        }}
      />

      <ColorControl
        value={textColor}
        onChangeImmediate={(v) => {
          setTextColor(v);
          onChange({ fill: v }, false);
        }}
        onCommit={() => onChange({ fill: textColor }, true)}
      />

      <OpacityControl
        valuePct={opacityPct}
        onChangeImmediate={(pct) => {
          setOpacityPct(pct);
          onChange({ opacity: pct / 100 }, false);
        }}
        onCommit={() => onChange({ opacity: opacityPct / 100 }, true)}
      />

      <AlignmentControl
        value={align}
        onPick={(v) => {
          setAlign(v);
          onChange({ align: v });
        }}
      />

      <LineHeightControl
        value={lineHeight}
        onChangeImmediate={(v) => {
          setLineHeight(v);
          onChange({ lineHeight: v }, false);
        }}
        onCommit={() => onChange({ lineHeight }, true)}
      />

      <LetterSpacingControl
        value={letterSpacing}
        onChangeImmediate={(v) => {
          setLetterSpacing(v);
          onChange({ letterSpacing: v }, false);
        }}
        onCommit={() => onChange({ letterSpacing }, true)}
      />

      <RotationControl
        value={angle}
        onChangeImmediate={(v) => {
          setAngle(v);
          onChange({ angle: v }, false);
        }}
        onCommit={() => onChange({ angle }, true)}
        onReset={() => {
          setAngle(0);
          onChange({ angle: 0 });
        }}
        ResetIcon={RotateCcw}
      />

      <TextBoxWidthControl
        stageWidth={stage.width}
        autoWidth={autoWidth}
        value={boxWidth}
        onToggleAuto={(next, nextWidth) => {
          setAutoWidth(next);
          setBoxWidth(next ? 0 : nextWidth);
          onChange({ boxWidth: next ? 0 : nextWidth });
        }}
        onFitToText={() => {
          setAutoWidth(true);
          setBoxWidth(0);
          onChange({ boxWidth: 0 });
        }}
        onWide={() => {
          const w = Math.round(stage.width * 0.8);
          setAutoWidth(false);
          setBoxWidth(w);
          onChange({ boxWidth: w });
        }}
        onChangeImmediate={(w) => {
          setBoxWidth(w);
          onChange({ boxWidth: w }, false);
        }}
        onCommit={() => onChange({ boxWidth }, true)}
        FitIcon={Minimize2}
        WideIcon={Maximize2}
      />

      <ShadowControl
        value={shadow}
        onToggle={(next) => {
          setShadow(next);
          onChange({ shadow: next });
        }}
        onChangeImmediate={(next) => {
          setShadow(next);
          onChange({ shadow: next }, false);
        }}
        onCommit={() => onChange({ shadow }, true)}
      />

      <ActionsBar
        stage={stage}
        onCenter={onCenter}
      />
    </div>
  );
};

export default TextControls;