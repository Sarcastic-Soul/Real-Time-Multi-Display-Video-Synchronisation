"use client";

import React from "react";

interface DriftBadgeProps {
  driftMs: number;
}

export const DriftBadge: React.FC<DriftBadgeProps> = ({ driftMs }) => {
  const absDrift = Math.abs(driftMs);

  let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  let statusText = "In Sync";

  if (absDrift > 750) {
    badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse";
    statusText = "Hard Seek";
  } else if (absDrift > 150) {
    badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    statusText = "Drifting (Soft Nudge)";
  }

  const sign = driftMs > 0 ? "+" : "";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeColor}`}
      >
        {sign}
        {driftMs} ms
      </span>
      <span className="text-xs text-slate-400 font-mono">({statusText})</span>
    </div>
  );
};
