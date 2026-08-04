"use client";

import React from "react";
import { useControllerStore } from "@/lib/useControllerStore";
import { DriftBadge } from "./DriftBadge";

export const DisplayTable: React.FC = () => {
  const displays = useControllerStore((s) => s.displays);

  const handleAddDisplay = () => {
    const randomId = `disp-${Math.floor(100 + Math.random() * 900)}`;
    window.open(`/display/${randomId}`, "_blank");
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Connected Display Clients
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active displays reporting position and drift to controller
          </p>
        </div>

        <button
          onClick={handleAddDisplay}
          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Open New Display Tab
        </button>
      </div>

      {displays.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
          <svg className="w-10 h-10 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-400 font-medium">No displays currently connected</p>
          <p className="text-xs text-slate-400 mt-1">Click "Open New Display Tab" above or navigate to /display/[id] to join</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-3">Client ID</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reported Position</th>
                <th className="py-3 px-3">Drift (vs Auth)</th>
                <th className="py-3 px-3">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {displays.map((disp) => {
                const agoMs = Date.now() - disp.lastReportAt;
                const isOnline = disp.connected && agoMs < 4000;

                return (
                  <tr key={disp.clientId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-cyan-300">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        {disp.clientId}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          disp.status === "playing"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : disp.status === "loading"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {disp.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {disp.positionSec.toFixed(2)}s
                    </td>
                    <td className="py-3 px-3">
                      <DriftBadge driftMs={disp.driftMs} />
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {(agoMs / 1000).toFixed(1)}s ago
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
