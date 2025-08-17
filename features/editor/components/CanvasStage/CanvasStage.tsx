"use client";

import React from "react";
import type { StageSize } from "@/features/editor/lib/types";

type Props = {
  stage: StageSize;
  // 👇 allow null in the ref type
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  className?: string;
  displayScale?: number;
};

const CanvasStage: React.FC<Props> = ({
  stage,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  className,
  displayScale = 1,
}) => {
  const cssW = Math.round(stage.width * displayScale);
  const cssH = Math.round(stage.height * displayScale);

  return (
    <div className={className} style={{ width: cssW, height: cssH }}>
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>} // fine: the DOM accepts null during mount
        width={cssW}
        height={cssH}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          width: cssW,
          height: cssH,
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(0,0,0,0.20)",
          backgroundColor: "transparent",
          cursor: "default",
          display: "block",
        }}
      />
    </div>
  );
};

export default CanvasStage;
