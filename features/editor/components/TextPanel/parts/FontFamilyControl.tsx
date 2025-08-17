import React from "react";
import FontSelector from "@/features/editor/ui/FontSelector";

type Props = {
  value: string;
  onPick: (family: string) => void;
};

export const FontFamilyControl: React.FC<Props> = ({ value, onPick }) => {
  return <FontSelector value={value} onChange={onPick} />;
};
