# Real-Time Multi-Display Video Sync System

A server-authoritative real-time video synchronization system driving video playback across multiple display endpoints with automatic drift detection, NTP clock latency estimation, soft playback rate scaling, and hard seek resynchronization.

---

## 🚀 Deployed Links & Repository

* **Live App (Render)**: [https://multi-display-video-sync.onrender.com](https://multi-display-video-sync.onrender.com)
* **Master Controller**: [https://multi-display-video-sync.onrender.com/controller](https://multi-display-video-sync.onrender.com/controller)
* **Display Client #1**: [https://multi-display-video-sync.onrender.com/display/disp-1](https://multi-display-video-sync.onrender.com/display/disp-1)
* **GitHub Repository**: [https://github.com/Sarcastic-Soul/Real-Time-Multi-Display-Video-Synchronisation](https://github.com/Sarcastic-Soul/Real-Time-Multi-Display-Video-Synchronisation)

---

## 🏗️ Architecture Diagram

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
                             |   - NTP ping/pong clock offset    |
                             +--------+-----------------+--------+
                                      |                 |
                          session:state                 session:state
                          display:command               display:command
                          sync:ping/pong                sync:ping/pong
                                      |                 |
                                      v                 v
                   +------------------+----+       +----+------------------+
                   |  Display Client #1    |       |  Display Client #2    |
                   |  (/display/disp-1)    |       |  (/display/disp-2)    |
                   |  (HTML5 <video>)      |       |  (HTML5 <video>)      |
                   +-----------------------+       +-----------------------+
```

---

## 🛠️ Tech Stack

- **Process Manager**: `concurrently` / `Docker` container
- **Server (`server/`)**: Node.js, Express, Socket.IO, Zod validation, TypeScript, `tsx`
- **Frontend (`web/`)**: Next.js 15 (App Router), React 19, `socket.io-client`, Zustand, Tailwind CSS

---

## ⚡ How to Run

### Prerequisites
- Node.js `>= 20.0.0` or Docker installed

---

### Option A: Typical Local Run (npm)

1. **Install Dependencies**:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix web
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   - Master Controller: [http://localhost:3000/controller](http://localhost:3000/controller)
   - Display Client #1: [http://localhost:3000/display/disp-1](http://localhost:3000/display/disp-2)
   - Display Client #2: [http://localhost:3000/display/disp-2](http://localhost:3000/display/disp-2)

---

### Option B: Docker Container Run (Local)

Build and run the container locally with Docker:

```bash
# 1. Build Docker Image
docker build -t multi-video-sync .

# 2. Run Container
docker run -d -p 3000:3000 -p 4000:4000 --name video-sync multi-video-sync
```

Access the app at `http://localhost:3000/controller`.

---

### Option C: Docker Hub Build & Push (For Render Deployment)

To build the Docker image, push it to Docker Hub, and pull it into Render or any cloud container provider:

```bash
# 1. Log in to Docker Hub
docker login

# 2. Build & Tag Image (Replace <YOUR_DOCKERHUB_USERNAME> with your Docker Hub ID)
docker build -t <YOUR_DOCKERHUB_USERNAME>/multi-video-sync:latest .

# 3. Push Image to Docker Hub
docker push <YOUR_DOCKERHUB_USERNAME>/multi-video-sync:latest

# 4. Pull & Run anywhere
docker run -d -p 3000:3000 -p 4000:4000 <YOUR_DOCKERHUB_USERNAME>/multi-video-sync:latest
```

---

## 🌟 Features & Core Capabilities

- **Server-Authoritative Position Model**: Server continuously evaluates `expectedPositionSec(now) = status === 'playing' ? positionAtLastUpdateSec + (now - lastUpdatedAt)/1000 : positionAtLastUpdateSec`.
- **NTP-Style Network Latency Offset Estimation**: Displays send periodic `sync:ping` packets to measure Round-Trip Time (RTT) and system clock offset via Exponential Moving Average (EMA), adjusting local expected time for microsecond network latency.
- **Multi-Room Session Support**: Managed room instances (`roomId`) allowing multiple isolated video wall sessions simultaneously.
- **Master Controller Dashboard**:
  - Video stream selector cards with live duration meta.
  - Interactive playback control bar (Play, Pause, Seek slider, Restart).
  - Real-time connected displays monitoring table with live position, status, and drift badges.
- **Display Clients**:
  - Native HTML5 `<video>` element with zero heavy external wrapper libraries.
  - Floating Debug HUD Overlay showing live server expected position vs local position, calculated drift, network RTT latency, clock offset, playback rate, and last correction event.
  - Mid-session joining and automatic reconnect synchronization.
- **Dual-Threshold Drift Correction**:
  - **Hard Seek (`|driftMs| > 750ms`)**: Instantly updates `video.currentTime` to authoritative position.
  - **Soft Nudge (`150ms < |driftMs| <= 750ms`)**: Temporarily adjusts `video.playbackRate` to `1.05x` (if lagging) or `0.95x` (if leading).
  - **2s Cooldown Window**: Enforces a 2-second cooldown between non-emergency corrections to prevent oscillation.

---

## 🧪 How to Test Drift Correction

1. Start the system via `npm run dev` or Docker.
2. Open the **Controller** ([http://localhost:3000/controller](http://localhost:3000/controller)).
3. Click **"Open New Display Tab"** twice to launch `disp-1` and `disp-2` in separate browser windows.
4. On the Controller, select a video and click **PLAY**. Notice both displays start playing in sync.
5. On one of the display tabs, use the **Debug HUD Overlay** at the bottom-right:
   - Click **"Seek -1.5s (Lag)"**: This induces a 1500ms drift. Observe the Debug HUD report a **HARD SEEK** correction that immediately pulls the player back into sync.
   - Click **"Seek +1.5s (Lead)"**: Observe another hard seek resynchronizing the player.
6. Check the Controller table: notice the drift badge for that display updating dynamically in real time alongside live NTP network RTT metrics.

---

## 💡 What I'd Do With More Time

1. **WebRTC DataChannels**: Implement P2P WebRTC data channels for sub-20ms peer-to-peer sync.
2. **GPU V-Sync Video Callbacks**: Utilize `requestVideoFrameCallback()` for hardware frame-locked synchronization.
3. **Adaptive Bitrate Streaming (HLS/DASH)**: Support `.m3u8` streams for dynamic multi-quality video walls.
