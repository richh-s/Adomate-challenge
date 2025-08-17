"use client";
import React from "react";

type Props = {
  history: string[];
  historyIndex: number;
  onJump: (index: number) => void;
};

const HistoryPanel: React.FC<Props> = ({ history, historyIndex, onJump }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">History</h2>
      {history.length === 0 ? (
        <div className="text-gray-400 text-sm">No history yet. Make changes to see snapshots.</div>
      ) : (
        <div className="space-y-1">
          {history.map((_, idx) => (
            <button
              key={idx}
              className={`w-full text-left px-3 py-2 rounded ${
                idx === historyIndex ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
              onClick={() => onJump(idx)}
            >
              State {idx + 1}
              {idx === historyIndex && " (current)"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
