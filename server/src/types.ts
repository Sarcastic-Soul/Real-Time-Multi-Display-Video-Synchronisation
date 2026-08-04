export type PlaybackStatus = "playing" | "paused" | "loading";

export interface VideoMeta {
  id: string;
  title: string;
  url: string;
  durationSec: number;
}

export interface SessionState {
  roomId: string;
  videoId: string | null;
  status: "playing" | "paused";
  positionAtLastUpdateSec: number; // authoritative position when lastUpdatedAt was set
  lastUpdatedAt: number;           // server epoch ms
  seq: number;                     // increments on every controller action
}

export interface DisplayStatusReport {
  clientId: string;
  roomId: string;
  connected: boolean;
  positionSec: number;
  status: PlaybackStatus;
  driftMs: number;
  rttMs?: number;
  clockOffsetMs?: number;
  lastReportAt: number;
}

export type ControllerCommand =
  | { type: "SELECT_VIDEO"; videoId: string; roomId?: string }
  | { type: "PLAY"; roomId?: string }
  | { type: "PAUSE"; roomId?: string }
  | { type: "SEEK"; positionSec: number; roomId?: string }
  | { type: "RESTART"; roomId?: string };

export interface SyncPingPayload {
  clientTime: number;
}

export interface SyncPongPayload {
  clientTime: number;
  serverTime: number;
}
