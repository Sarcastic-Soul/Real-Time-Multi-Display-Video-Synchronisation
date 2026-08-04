import { SessionState, ControllerCommand } from "../types.js";

export class SessionStateManager {
  private rooms: Map<string, SessionState>;

  constructor() {
    this.rooms = new Map();
    this.getRoomState("default-room");
  }

  public getRoomState(roomId: string = "default-room"): SessionState {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        videoId: "sample-1",
        status: "paused",
        positionAtLastUpdateSec: 0,
        lastUpdatedAt: Date.now(),
        seq: 0,
      });
    }
    return { ...this.rooms.get(roomId)! };
  }

  public getState(roomId: string = "default-room"): SessionState {
    return this.getRoomState(roomId);
  }

  public getExpectedPositionSec(roomId: string = "default-room", now: number = Date.now()): number {
    const state = this.getRoomState(roomId);
    if (state.status === "paused") {
      return state.positionAtLastUpdateSec;
    }
    const elapsedSec = (now - state.lastUpdatedAt) / 1000;
    return Math.max(0, state.positionAtLastUpdateSec + elapsedSec);
  }

  public applyCommand(command: ControllerCommand, now: number = Date.now()): SessionState {
    const roomId = command.roomId || "default-room";
    let state = this.getRoomState(roomId);
    const currentExpected = this.getExpectedPositionSec(roomId, now);

    switch (command.type) {
      case "SELECT_VIDEO":
        state = {
          roomId,
          videoId: command.videoId,
          status: "paused",
          positionAtLastUpdateSec: 0,
          lastUpdatedAt: now,
          seq: state.seq + 1,
        };
        break;

      case "PLAY":
        state = {
          ...state,
          status: "playing",
          positionAtLastUpdateSec: currentExpected,
          lastUpdatedAt: now,
          seq: state.seq + 1,
        };
        break;

      case "PAUSE":
        state = {
          ...state,
          status: "paused",
          positionAtLastUpdateSec: currentExpected,
          lastUpdatedAt: now,
          seq: state.seq + 1,
        };
        break;

      case "SEEK":
        state = {
          ...state,
          positionAtLastUpdateSec: Math.max(0, command.positionSec),
          lastUpdatedAt: now,
          seq: state.seq + 1,
        };
        break;

      case "RESTART":
        state = {
          ...state,
          positionAtLastUpdateSec: 0,
          lastUpdatedAt: now,
          seq: state.seq + 1,
        };
        break;
    }

    this.rooms.set(roomId, state);
    return { ...state };
  }
}
