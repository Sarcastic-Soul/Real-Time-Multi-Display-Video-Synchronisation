import { create } from "zustand";
import { SessionState, PlaybackStatus } from "./types";
import { socket } from "./socket";

interface DisplayStore {
  clientId: string;
  connected: boolean;
  sessionState: SessionState | null;
  localStatus: PlaybackStatus;
  currentPositionSec: number;
  driftMs: number;
  playbackRate: number;
  lastCorrectionType: "none" | "soft" | "hard";
  lastCorrectionAt: number;

  setClientId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  setSessionState: (state: SessionState) => void;
  setLocalStatus: (status: PlaybackStatus) => void;
  setCurrentPositionSec: (pos: number) => void;
  setDriftMs: (driftMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  setCorrection: (type: "soft" | "hard", now: number) => void;
  sendStatusReport: () => void;
}

export const useDisplayStore = create<DisplayStore>((set, get) => ({
  clientId: "",
  connected: false,
  sessionState: null,
  localStatus: "paused",
  currentPositionSec: 0,
  driftMs: 0,
  playbackRate: 1.0,
  lastCorrectionType: "none",
  lastCorrectionAt: 0,

  setClientId: (clientId) => set({ clientId }),
  setConnected: (connected) => set({ connected }),
  setSessionState: (sessionState) => set({ sessionState }),
  setLocalStatus: (localStatus) => set({ localStatus }),
  setCurrentPositionSec: (currentPositionSec) => set({ currentPositionSec }),
  setDriftMs: (driftMs) => set({ driftMs }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setCorrection: (lastCorrectionType, lastCorrectionAt) =>
    set({ lastCorrectionType, lastCorrectionAt }),

  sendStatusReport: () => {
    const { clientId, currentPositionSec, localStatus } = get();
    if (!clientId) return;
    socket.emit("display:statusReport", {
      clientId,
      positionSec: currentPositionSec,
      status: localStatus,
    });
  },
}));
