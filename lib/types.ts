export type StageSize = { width: number; height: number };

export type Shadow = {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
};

export type TextNode = {
  id: string;
  text: string;
  x: number;         // anchor X (uses align)
  y: number;         // top Y
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fill: string;      // hex color
  opacity: number;   // 0..1
  align: "left" | "center" | "right";
  lineHeight: number;// 1.0 default
  letterSpacing: number; // px
  shadow: Shadow;
  visible: boolean;
  locked: boolean;
};

export type SerializableState = {
  stage: StageSize;
  bgUrl: string | null;
  texts: TextNode[];
};
