"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "@/lib/socket";
import { useDisplayStore } from "@/lib/useDisplayStore";
import { SessionState, ControllerCommand, PlaybackStatus } from "@/lib/types";
import { getVideoById } from "@/lib/videoLibrary";
import { DebugOverlay } from "./DebugOverlay";

const HARD_SEEK_THRESHOLD_MS = 750;
const SOFT_THRESHOLD_MS = 150;
const CORRECTION_COOLDOWN_MS = 2000;

interface VideoPlayerProps {
  clientId: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ clientId }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setClientId = useDisplayStore((s) => s.setClientId);
  const setConnected = useDisplayStore((s) => s.setConnected);
  const setSessionState = useDisplayStore((s) => s.setSessionState);
  const setLocalStatus = useDisplayStore((s) => s.setLocalStatus);
  const setCurrentPositionSec = useDisplayStore((s) => s.setCurrentPositionSec);
  const setDriftMs = useDisplayStore((s) => s.setDriftMs);
  const setPlaybackRate = useDisplayStore((s) => s.setPlaybackRate);
  const setCorrection = useDisplayStore((s) => s.setCorrection);
  const sendStatusReport = useDisplayStore((s) => s.sendStatusReport);

  const sessionState = useDisplayStore((s) => s.sessionState);

  const [expectedPosSec, setExpectedPosSec] = useState<number>(0);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [playError, setPlayError] = useState<string | null>(null);

  const lastCorrectionTimeRef = useRef<number>(0);
  const activeVideo = getVideoById(sessionState?.videoId || null);

  // Compute server's current expected position
  const calculateExpectedPosition = useCallback((state: SessionState | null, now: number = Date.now()): number => {
    if (!state) return 0;
    if (state.status === "paused") {
      return state.positionAtLastUpdateSec;
    }
    const elapsedSec = (now - state.lastUpdatedAt) / 1000;
    return Math.max(0, state.positionAtLastUpdateSec + elapsedSec);
  }, []);

  // Initialize socket listeners & display registration
  useEffect(() => {
    setClientId(clientId);

    const onConnect = () => {
      setConnected(true);
      socket.emit("display:register", { clientId });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onSessionState = (state: SessionState) => {
      setSessionState(state);
    };

    const onDisplayCommand = (command: ControllerCommand) => {
      // Immediate reaction to explicit controller commands
      const video = videoRef.current;
      if (!video) return;

      const now = Date.now();
      if (command.type === "PLAY") {
        video.play().catch((err) => {
          console.warn("Autoplay block:", err);
          setPlayError("Click anywhere to enable video audio & playback");
        });
      } else if (command.type === "PAUSE") {
        video.pause();
      } else if (command.type === "SEEK") {
        video.currentTime = Math.max(0, command.positionSec);
        lastCorrectionTimeRef.current = now;
        setCorrection("hard", now);
      } else if (command.type === "RESTART") {
        video.currentTime = 0;
        lastCorrectionTimeRef.current = now;
        setCorrection("hard", now);
      }
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("session:state", onSessionState);
    socket.on("display:command", onDisplayCommand);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("session:state", onSessionState);
      socket.off("display:command", onDisplayCommand);
    };
  }, [clientId, setClientId, setConnected, setSessionState, setCorrection]);

  // Main synchronization and tick loop (runs every 200ms)
  useEffect(() => {
    const syncLoop = setInterval(() => {
      const video = videoRef.current;
      if (!video || !sessionState) return;

      const now = Date.now();
      const rawExpPos = calculateExpectedPosition(sessionState, now);
      const videoDuration = video.duration && !isNaN(video.duration) ? video.duration : (activeVideo?.durationSec || Infinity);
      const expPos = Math.min(videoDuration, rawExpPos);
      setExpectedPosSec(expPos);

      const currentPos = video.currentTime;
      setCurrentPositionSec(currentPos);

      const status: PlaybackStatus = video.seeking || video.readyState < 3
        ? "loading"
        : video.paused
        ? "paused"
        : "playing";
      setLocalStatus(status);

      // Compute drift in ms
      const drift = Math.round((currentPos - expPos) * 1000);
      setDriftMs(drift);
      const absDrift = Math.abs(drift);

      // Match server playback status (play/pause)
      const hasReachedEnd = currentPos >= videoDuration - 0.1 || video.ended;
      if (sessionState.status === "playing" && video.paused && !video.seeking && !hasReachedEnd) {
        video.play().catch(() => setPlayError("Click anywhere on screen to enable video playback"));
      } else if ((sessionState.status === "paused" || hasReachedEnd) && !video.paused) {
        video.pause();
      }

      // Check correction cooldown
      const timeSinceLastCorrection = now - lastCorrectionTimeRef.current;
      const canCorrect = timeSinceLastCorrection >= CORRECTION_COOLDOWN_MS;

      // 1. Hard Seek Strategy (> 750ms drift)
      if (absDrift > HARD_SEEK_THRESHOLD_MS && canCorrect) {
        video.currentTime = expPos;
        video.playbackRate = 1.0;
        setPlaybackRate(1.0);
        lastCorrectionTimeRef.current = now;
        setCorrection("hard", now);
      }
      // 2. Soft Nudge Strategy (> 150ms drift)
      else if (absDrift > SOFT_THRESHOLD_MS && canCorrect && sessionState.status === "playing") {
        if (drift < -SOFT_THRESHOLD_MS) {
          // Video is behind -> play slightly faster (1.05x)
          video.playbackRate = 1.05;
          setPlaybackRate(1.05);
        } else if (drift > SOFT_THRESHOLD_MS) {
          // Video is ahead -> play slightly slower (0.95x)
          video.playbackRate = 0.95;
          setPlaybackRate(0.95);
        }
        lastCorrectionTimeRef.current = now;
        setCorrection("soft", now);
      }
      // 3. Reset rate when back in tight sync (< 50ms drift)
      else if (absDrift < 50 && video.playbackRate !== 1.0) {
        video.playbackRate = 1.0;
        setPlaybackRate(1.0);
      }

      // Send status report to server
      sendStatusReport();
    }, 200);

    return () => clearInterval(syncLoop);
  }, [
    sessionState,
    calculateExpectedPosition,
    setCurrentPositionSec,
    setLocalStatus,
    setDriftMs,
    setPlaybackRate,
    setCorrection,
    sendStatusReport,
  ]);

  // Handle user interaction for autoplay permission
  const handleUserInteraction = () => {
    setUserInteracted(true);
    setPlayError(null);
    if (videoRef.current && sessionState?.status === "playing") {
      videoRef.current.play().catch(console.error);
    }
  };

  // Induce drift for testing/demonstration
  const handleInduceDrift = (deltaSec: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, video.currentTime + deltaSec);
    }
  };

  return (
    <div
      onClick={handleUserInteraction}
      className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Native HTML5 Video Element */}
      {activeVideo ? (
        <video
          ref={videoRef}
          src={activeVideo.url}
          playsInline
          muted={!userInteracted} // muted initially to bypass browser autoplay policies
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="text-slate-500 text-sm font-mono">No Video Loaded</div>
      )}

      {/* Autoplay / Unmute Prompt Banner */}
      {playError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 px-4 py-2 rounded-lg font-semibold text-xs shadow-xl animate-bounce pointer-events-none z-40">
          ⚠️ {playError}
        </div>
      )}

      {/* Display ID Tag */}
      <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 backdrop-blur-md z-30">
        Display: <span className="text-white font-bold">{clientId}</span>
      </div>

      {/* Real-time Debug HUD Overlay */}
      <DebugOverlay
        expectedPosSec={expectedPosSec}
        onInduceDrift={handleInduceDrift}
      />
    </div>
  );
};
