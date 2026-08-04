"use client";

import React, { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useControllerStore } from "@/lib/useControllerStore";
import { VideoPicker } from "@/components/controller/VideoPicker";
import { PlaybackControls } from "@/components/controller/PlaybackControls";
import { DisplayTable } from "@/components/controller/DisplayTable";

export default function ControllerPage() {
  const connected = useControllerStore((s) => s.connected);
  const setConnected = useControllerStore((s) => s.setConnected);
  const setSessionState = useControllerStore((s) => s.setSessionState);
  const setDisplays = useControllerStore((s) => s.setDisplays);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onSessionState = (state: any) => setSessionState(state);
    const onSessionDisplays = (displays: any[]) => setDisplays(displays);

    if (socket.connected) {
      setConnected(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("session:state", onSessionState);
    socket.on("session:displays", onSessionDisplays);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("session:state", onSessionState);
      socket.off("session:displays", onSessionDisplays);
    };
  }, [setConnected, setSessionState, setDisplays]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Multi-Display Sync Controller
              </h1>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                Authoritative Master
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-display video synchronization server & dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="text-slate-300">
                Socket: {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </header>

        {/* Video Picker */}
        <VideoPicker />

        {/* Playback Controls */}
        <PlaybackControls />

        {/* Connected Displays Table */}
        <DisplayTable />
      </div>
    </main>
  );
}
