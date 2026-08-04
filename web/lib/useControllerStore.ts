import { create } from "zustand";
import { SessionState, DisplayStatusReport, ControllerCommand } from "./types";
import { socket } from "./socket";

interface ControllerStore {
  connected: boolean;
  sessionState: SessionState | null;
  displays: DisplayStatusReport[];
  setConnected: (connected: boolean) => void;
  setSessionState: (state: SessionState) => void;
  setDisplays: (displays: DisplayStatusReport[]) => void;
  sendCommand: (command: ControllerCommand) => void;
}

export const useControllerStore = create<ControllerStore>((set) => ({
  connected: false,
  sessionState: null,
  displays: [],
  setConnected: (connected) => set({ connected }),
  setSessionState: (sessionState) => set({ sessionState }),
  setDisplays: (displays) => set({ displays }),
  sendCommand: (command) => {
    socket.emit("controller:command", command);
  },
}));
