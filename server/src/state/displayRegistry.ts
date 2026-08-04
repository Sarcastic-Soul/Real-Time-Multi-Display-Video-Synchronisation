import { DisplayStatusReport, PlaybackStatus } from "../types.js";

interface InternalDisplayRecord {
  clientId: string;
  socketId: string;
  roomId: string;
  connected: boolean;
  positionSec: number;
  status: PlaybackStatus;
  driftMs: number;
  rttMs: number;
  clockOffsetMs: number;
  lastReportAt: number;
}

export class DisplayRegistry {
  private displays: Map<string, InternalDisplayRecord> = new Map();

  public registerDisplay(clientId: string, socketId: string, roomId: string = "default-room"): void {
    const existing = this.displays.get(clientId);
    this.displays.set(clientId, {
      clientId,
      socketId,
      roomId,
      connected: true,
      positionSec: existing ? existing.positionSec : 0,
      status: existing ? existing.status : "paused",
      driftMs: existing ? existing.driftMs : 0,
      rttMs: existing ? existing.rttMs : 0,
      clockOffsetMs: existing ? existing.clockOffsetMs : 0,
      lastReportAt: Date.now(),
    });
  }

  public updateStatusReport(
    clientId: string,
    positionSec: number,
    status: PlaybackStatus,
    expectedPositionSec: number,
    now: number = Date.now(),
    rttMs: number = 0,
    clockOffsetMs: number = 0
  ): void {
    const display = this.displays.get(clientId);
    if (!display) return;

    const driftMs = Math.round((positionSec - expectedPositionSec) * 1000);

    display.positionSec = positionSec;
    display.status = status;
    display.driftMs = driftMs;
    display.rttMs = rttMs;
    display.clockOffsetMs = clockOffsetMs;
    display.lastReportAt = now;
    display.connected = true;
  }

  public handleDisconnectBySocketId(socketId: string): string | null {
    for (const [clientId, display] of this.displays.entries()) {
      if (display.socketId === socketId) {
        display.connected = false;
        return clientId;
      }
    }
    return null;
  }

  public getDisplaysReport(expectedPositionSec: number, now: number = Date.now(), roomId: string = "default-room"): DisplayStatusReport[] {
    const reports: DisplayStatusReport[] = [];
    for (const display of this.displays.values()) {
      if (display.roomId !== roomId && roomId !== "*") continue;

      const currentDriftMs = display.connected
        ? Math.round((display.positionSec - expectedPositionSec) * 1000)
        : display.driftMs;

      reports.push({
        clientId: display.clientId,
        roomId: display.roomId,
        connected: display.connected,
        positionSec: display.positionSec,
        status: display.status,
        driftMs: currentDriftMs,
        rttMs: display.rttMs,
        clockOffsetMs: display.clockOffsetMs,
        lastReportAt: display.lastReportAt,
      });
    }
    return reports;
  }
}
