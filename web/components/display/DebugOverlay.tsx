"use client";

import React, { useState } from "react";
import { useDisplayStore } from "@/lib/useDisplayStore";

interface DebugOverlayProps {
  expectedPosSec: number;
  onInduceDrift: (deltaSec: number) => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ expectedPosSec, onInduceDrift }) => {
  const [collapsed, setCollapsed] = useState(false);

  const clientId = useDisplayStore((s) => s.clientId);
  const connected = useDisplayStore((s) => s.connected);
  const sessionState = useDisplayStore((s) => s.sessionState);
  const localStatus = useDisplayStore((s) => s.localStatus);
  const currentPositionSec = useDisplayStore((s) => s.currentPositionSec);
  const driftMs = useDisplayStore((s) => s.driftMs);
  const playbackRate = useDisplayStore((s) => s.playbackRate);
  const lastCorrectionType = useDisplayStore((s) => s.lastCorrectionType);
  const lastCorrectionAt = useDisplayStore((s) => s.lastCorrectionAt);

  const absDrift = Math.abs(driftMs);
  const agoCorrectionSec = lastCorrectionAt ? ((Date.now() - lastCorrectionAt) / 1000).toFixed(1) : null;

  let driftBadgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (absDrift > 750) {
    driftBadgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse";
  } else if (absDrift > 150) {
    driftBadgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-semibold backdrop-blur-md shadow-xl flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          HUD ({clientId}) - Drift: {driftMs > 0 ? `+${driftMs}` : driftMs}ms
        </button>
      ) : (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 w-80 text-xs font-mono text-slate-300 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="font-bold text-cyan-300 text-sm">{clientId || "Connecting..."}</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              Minimize
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Server Status:</span>
              <span className="font-semibold text-white uppercase">{sessionState?.status || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Local Status:</span>
              <span className="font-semibold text-cyan-400 uppercase">{localStatus}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Auth Exp Position:</span>
              <span className="text-white font-semibold">{expectedPosSec.toFixed(2)}s</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Local Player Pos:</span>
              <span className="text-white font-semibold">{currentPositionSec.toFixed(2)}s</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Calculated Drift:</span>
              <span className={`px-2 py-0.5 rounded border font-bold ${driftBadgeColor}`}>
                {driftMs > 0 ? `+${driftMs}` : driftMs} ms
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Playback Rate:</span>
              <span className="font-bold text-cyan-300">{playbackRate.toFixed(2)}x</span>
            </div>

            <div className="flex justify-between border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">Last Correction:</span>
              <span className="text-white">
                {lastCorrectionType === "none" ? (
                  <span className="text-slate-400">None</span>
                ) : (
                  <span className={lastCorrectionType === "hard" ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>
                    {lastCorrectionType.toUpperCase()} ({agoCorrectionSec}s ago)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Controls to induce drift for verification testing */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">
              Induce Drift (Dev Testing)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onInduceDrift(-1.5)}
                className="px-2 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded text-[11px] font-semibold transition-all"
              >
                Seek -1.5s (Lag)
              </button>
              <button
                onClick={() => onInduceDrift(1.5)}
                className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded text-[11px] font-semibold transition-all"
              >
                Seek +1.5s (Lead)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
