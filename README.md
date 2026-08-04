# Real-Time Multi-Display Video Sync System

A server-authoritative real-time video synchronization system driving video playback across multiple display endpoints with automatic drift detection, soft playback rate scaling, and hard seek resynchronization.

---

## Architecture Diagram

```
                             +-----------------------------------+
                             |     Controller Web App (/controller)
                             |   (Next.js + Zustand + Socket.IO) |
                             +-----------------+-----------------+
                                               |
                                     controller:command
                                               |
                                               v
                             +-----------------+-----------------+
                             |    Authoritative Sync Server      |
                             |   (Node.js + Express + Socket.IO) |
                             |   - Owns authoritative position   |
                             |   - Runs 250ms tick broadcast loop|
                             +--------+-----------------+--------+
                                      |                 |
                          session:state                 session:state
                          display:command               display:command
                                      |                 |
                                      v                 v
                   +------------------+----+       +----+------------------+
                   |  Display Client #1    |       |  Display Client #2    |
                   |  (/display/disp-1)    |       |  (/display/disp-2)    |
                   |  (HTML5 <video>)      |       |  (HTML5 <video>)      |
                   +-----------------------+       +-----------------------+
```

---

## Tech Stack

- **Root**: `concurrently` process manager
- **`server/`**: Node.js, Express, Socket.IO, Zod validation, TypeScript, `tsx`
- **`web/`**: Next.js 15 (App Router), React 19, `socket.io-client`, Zustand, Tailwind CSS

---

## Quickstart & Setup

### Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### 1. Install Dependencies
Run from the repository root:
```bash
npm install
npm install --prefix server
npm install --prefix web
```

### 2. Run Locally
To start both the sync server (port `4000`) and web client (port `3000`) concurrently:
```bash
npm run dev
```

- **Master Controller Dashboard**: [http://localhost:3000/controller](http://localhost:3000/controller)
- **Display Client 1**: [http://localhost:3000/display/disp-1](http://localhost:3000/display/disp-1)
- **Display Client 2**: [http://localhost:3000/display/disp-2](http://localhost:3000/display/disp-2)

---

## Features & Core Capabilities

- **Server-Authoritative Position Model**: Server continuously evaluates `expectedPositionSec(now) = status === 'playing' ? positionAtLastUpdateSec + (now - lastUpdatedAt)/1000 : positionAtLastUpdateSec`.
- **Master Controller Dashboard**:
  - Video stream selector dropdown/cards.
  - Interactive playback control bar (Play, Pause, Seek slider, Restart).
  - Real-time connected displays monitoring table with live position and drift badges.
- **Display Clients**:
  - Native HTML5 `<video>` element with zero heavy external wrapper libraries.
  - Floating Debug HUD Overlay showing live server expected position vs local position, calculated drift, playback rate, and last correction event.
  - Mid-session joining and automatic reconnect synchronization.
- **Dual-Threshold Drift Correction**:
  - **Hard Seek (`|driftMs| > 750ms`)**: Instantly updates `video.currentTime` to authoritative position.
  - **Soft Nudge (`150ms < |driftMs| <= 750ms`)**: Temporarily adjusts `video.playbackRate` to `1.05x` (if lagging) or `0.95x` (if leading).
  - **2s Cooldown Window**: Enforces a 2-second cooldown between non-emergency corrections to prevent oscillation.

---

## How to Test Drift Correction

1. Start the system via `npm run dev`.
2. Open the **Controller** ([http://localhost:3000/controller](http://localhost:3000/controller)).
3. Click **"Open New Display Tab"** twice to launch `disp-1` and `disp-2` in separate browser windows.
4. On the Controller, select a video and click **PLAY**. Notice both displays start playing in sync.
5. On one of the display tabs, use the **Debug HUD Overlay** at the bottom-right:
   - Click **"Seek -1.5s (Lag)"**: This induces a 1500ms drift. Observe the Debug HUD report a **HARD SEEK** correction that immediately pulls the player back into sync.
   - Click **"Seek +1.5s (Lead)"**: Observe another hard seek resynchronizing the player.
6. Check the Controller table: notice the drift badge for that display updating dynamically in real time.

---

## What I'd Do With More Time

1. **NTP-Style Clock Offset Estimation**: Calculate network round-trip time (RTT) between server and clients to adjust `Date.now()` timestamps for network latency.
2. **WebRTC DataChannels**: Implement P2P WebRTC data channels for sub-50ms peer-to-peer sync.
3. **Frame-Accurate Video Decoding**: Use HTML5 `requestVideoFrameCallback()` for precise video frame count synchronization.
4. **Multi-Room Support**: Support room IDs in socket payloads to enable multiple isolated playback sessions concurrently.
