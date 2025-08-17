import React from "react";
import type { StageSize } from "@/features/editor/lib/types";

type Props = {
  stage: StageSize;
  onCenter: () => void;
};

export const ActionsBar: React.FC<Props> = ({ stage, onCenter }) => {
  return (
    <div className="pt-2">
      <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded" onClick={onCenter}>
        Center on Canvas ({stage.width}×{stage.height})
      </button>
    </div>
  );
};
