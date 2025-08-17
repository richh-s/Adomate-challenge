"use client";

import React from "react";

type Props = {
  history: string[];
  historyIndex: number; // 0-based; -1 means empty
  onJump: (index: number) => void;
};

const HistoryPanel: React.FC<Props> = ({ history, historyIndex, onJump }) => {
  const total = history.length;
  const current = historyIndex >= 0 ? historyIndex + 1 : 0;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          History{" "}
          <span className="ml-2 text-xs text-gray-400">
            ({current}/{total})
          </span>
        </h2>

        {total > 0 && historyIndex !== total - 1 && (
          <button
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
            onClick={() => onJump(total - 1)}
            title="Jump to latest state"
          >
            Latest
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="text-gray-400 text-sm">
          No history yet. Make changes to see snapshots.
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-auto pr-1">
          {history.map((_, idx) => {
            const isCurrent = idx === historyIndex;
            return (
              <button
                key={idx}
                type="button"
                className={`w-full text-left px-3 py-2 rounded transition-colors ${
                  isCurrent ? "bg-blue-600 text-white" : "hover:bg-gray-700"
                }`}
                aria-current={isCurrent}
                onClick={() => onJump(idx)}
              >
                State {idx + 1}
                {isCurrent && " (current)"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
