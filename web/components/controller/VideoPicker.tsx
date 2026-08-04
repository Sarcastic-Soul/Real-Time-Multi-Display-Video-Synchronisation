"use client";

import React from "react";
import { SAMPLE_VIDEOS } from "@/lib/videoLibrary";
import { useControllerStore } from "@/lib/useControllerStore";

export const VideoPicker: React.FC = () => {
  const sessionState = useControllerStore((s) => s.sessionState);
  const sendCommand = useControllerStore((s) => s.sendCommand);

  const selectedId = sessionState?.videoId || SAMPLE_VIDEOS[0].id;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Select Video Stream
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLE_VIDEOS.map((video) => {
          const isSelected = video.id === selectedId;
          return (
            <button
              key={video.id}
              onClick={() => sendCommand({ type: "SELECT_VIDEO", videoId: video.id })}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                isSelected
                  ? "bg-cyan-500/10 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10"
                  : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm truncate">{video.title}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Duration: {Math.floor(video.durationSec / 60)}m {video.durationSec % 60}s
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
