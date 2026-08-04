"use client";

import React, { useState, useEffect } from "react";
import { useControllerStore } from "@/lib/useControllerStore";
import { getVideoById } from "@/lib/videoLibrary";

export const PlaybackControls: React.FC = () => {
  const sessionState = useControllerStore((s) => s.sessionState);
  const sendCommand = useControllerStore((s) => s.sendCommand);

  const [currentPosSec, setCurrentPosSec] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekVal, setSeekVal] = useState<number>(0);

  const activeVideo = getVideoById(sessionState?.videoId || null);
  const duration = activeVideo ? activeVideo.durationSec : 100;
  const isPlaying = sessionState?.status === "playing";

  useEffect(() => {
    if (!sessionState) return;

    const calculatePos = () => {
      if (sessionState.status === "paused") {
        return sessionState.positionAtLastUpdateSec;
      }
      const elapsed = (Date.now() - sessionState.lastUpdatedAt) / 1000;
      return Math.min(duration, Math.max(0, sessionState.positionAtLastUpdateSec + elapsed));
    };

    setCurrentPosSec(calculatePos());

    if (sessionState.status === "playing") {
      const interval = setInterval(() => {
        setCurrentPosSec(calculatePos());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [sessionState, duration]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSeekVal(val);
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
    sendCommand({ type: "SEEK", positionSec: seekVal });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  const displayedTime = isSeeking ? seekVal : currentPosSec;
  const progressPercent = duration > 0 ? (displayedTime / duration) * 100 : 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Playback Controls
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Video: <span className="text-cyan-400 font-semibold">{activeVideo?.title}</span> | State:{" "}
            <span
              className={`font-semibold ${
                isPlaying ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {sessionState?.status?.toUpperCase() || "PAUSED"}
            </span>
          </p>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-md text-xs font-mono text-slate-400 border border-slate-700">
          Seq: <span className="text-cyan-400 font-bold">#{sessionState?.seq ?? 0}</span>
        </div>
      </div>

      {/* Seek bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1.5">
          <span>{formatTime(displayedTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={displayedTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onTouchStart={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchEnd={handleSeekMouseUp}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <div
            className="absolute left-0 top-0 h-2 bg-cyan-500 rounded-lg pointer-events-none transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Transport buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            sendCommand({ type: isPlaying ? "PAUSE" : "PLAY" })
          }
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-md ${
            isPlaying
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
          }`}
        >
          {isPlaying ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </>
          )}
        </button>

        <button
          onClick={() => sendCommand({ type: "RESTART" })}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restart (0s)
        </button>

        <div className="ml-auto text-xs font-mono text-slate-400">
          Auth Pos: <span className="text-white font-semibold">{currentPosSec.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
};
