# System Design & Synchronization Architecture

## 1. Executive Overview

The **Real-Time Multi-Display Video Sync System** is designed to synchronize HTML5 video playback across multiple display endpoints driven by a central controller. 

To achieve frame-accurate synchronization over standard WebSockets (Socket.IO) without heavy third-party media players, the system enforces a **server-authoritative state model** paired with a **dual-threshold client-side drift correction algorithm**.

---

## 2. Authoritative State Model

### 2.1 State Representation

The server maintains a single global session state (`SessionState`) in memory:

```typescript
export interface SessionState {
  videoId: string | null;            // Active video identifier
  status: "playing" | "paused";      // Authoritative playback status
  positionAtLastUpdateSec: number;   // Video playback position when lastUpdatedAt was recorded
  lastUpdatedAt: number;             // Server epoch timestamp in milliseconds
  seq: number;                       // Monotonically increasing sequence number for state changes
}
```

### 2.2 Expected Position Calculation Formula

At any server or client epoch timestamp $t_{\text{now}}$ (in milliseconds):

$$\text{expectedPositionSec}(t_{\text{now}}) = 
\begin{cases} 
\text{positionAtLastUpdateSec} & \text{if status} = \text{"paused"} \\
\text{positionAtLastUpdateSec} + \frac{t_{\text{now}} - \text{lastUpdatedAt}}{1000} & \text{if status} = \text{"playing"}
\end{cases}$$

### 2.3 Command State Transitions

Whenever a controller issues a command (`SELECT_VIDEO`, `PLAY`, `PAUSE`, `SEEK`, `RESTART`):
1. The server re-evaluates the current expected position $\text{expectedPositionSec}(t_{\text{now}})$.
2. The server updates `positionAtLastUpdateSec` based on the command:
   - **`SELECT_VIDEO`**: Sets `positionAtLastUpdateSec = 0`, `status = "paused"`, `videoId = newId`.
   - **`PLAY`**: Sets `positionAtLastUpdateSec = currentExpected`, `status = "playing"`.
   - **`PAUSE`**: Sets `positionAtLastUpdateSec = currentExpected`, `status = "paused"`.
   - **`SEEK`**: Sets `positionAtLastUpdateSec = targetPosition`, retains `status`.
   - **`RESTART`**: Sets `positionAtLastUpdateSec = 0`, retains `status`.
3. Sets `lastUpdatedAt = Date.now()` and increments `seq`.
4. Broadcasts `session:state` to all connected clients and `display:command` to displays.

---

## 3. Drift Calculation & Correction Algorithm

### 3.1 Drift Measurement

Each **Display** client calculates its drift relative to the authoritative server expected position:

$$\text{driftMs} = (\text{video.currentTime} - \text{expectedPositionSec}(t_{\text{now}})) \times 1000$$

- **Positive drift ($\text{driftMs} > 0$)**: Local video is **ahead** of the server.
- **Negative drift ($\text{driftMs} < 0$)**: Local video is **behind** the server.

### 3.2 Correction Strategy (Dual-Threshold + Cooldown)

To balance immediate resynchronization with smooth visual playback (avoiding stuttering or constant micro-seeks), the client applies two thresholds:

```
                  -750ms                   -150ms       0      +150ms                   +750ms
  <---------------|--------------------------|----------|----------|--------------------------|--------------->
    HARD SEEK         SOFT NUDGE (1.05x)            IN SYNC          SOFT NUDGE (0.95x)          HARD SEEK
   (video.currentTime = expectedPos)             (rate = 1.0)        (video.currentTime = expectedPos)
```

1. **Hard Seek Threshold (`|driftMs| > 750ms`)**:
   - **Action**: Immediately updates native `<video>.currentTime = expectedPos` and resets `playbackRate = 1.0`.
   - **Rationale**: For severe drift (network hiccup, tab backgrounding, manual seek), soft adjustment takes too long to catch up. A hard seek restores synchronization instantaneously.

2. **Soft Adjustment Threshold (`150ms < |driftMs| <= 750ms`)**:
   - **Action**: Dynamically scales `<video>.playbackRate`:
     - If $\text{driftMs} < -150$ (behind): `playbackRate = 1.05` (+5% speed to catch up smoothly).
     - If $\text{driftMs} > +150$ (ahead): `playbackRate = 0.95` (-5% speed to let server catch up).
   - **Rationale**: Smoothly nudges audio/video pitch without jarring visual cuts or audio pops.

3. **In-Sync Zone (`|driftMs| < 50ms`)**:
   - **Action**: Resets `playbackRate = 1.0`.

4. **Correction Cooldown (`CORRECTION_COOLDOWN_MS = 2000ms`)**:
   - Enforces a 2-second cooldown window between non-emergency correction adjustments to prevent rate oscillation or feedback loops caused by render tick jitter.

---

## 4. Socket Communication Protocol

| Event Name | Direction | Payload Schema | Description |
|---|---|---|---|
| `controller:command` | Client $\rightarrow$ Server | `ControllerCommand` | Controller action (`PLAY`, `PAUSE`, `SEEK`, `SELECT_VIDEO`, `RESTART`) |
| `display:register` | Client $\rightarrow$ Server | `{ clientId: string }` | Display registration on socket connect |
| `display:statusReport` | Client $\rightarrow$ Server | `{ clientId, positionSec, status }` | Display heartbeat sent every ~500ms |
| `session:state` | Server $\rightarrow$ Client | `SessionState` | Authoritative session state broadcast every 250ms tick |
| `session:displays` | Server $\rightarrow$ Controller | `DisplayStatusReport[]` | Active displays report summary for controller dashboard |
| `display:command` | Server $\rightarrow$ Display | `ControllerCommand` | Direct command notification to trigger client reaction |

---

## 5. Architectural Trade-offs & Future Work

### 5.1 Trade-offs Made
1. **Single Global Session**: Simplified architecture suitable for multi-display video wall demos; multi-room support would require session/room IDs in socket channels.
2. **In-Memory Server State**: Fast and zero-dependency, but state resets on server restart (acceptable for demo scope).
3. **Muted Autoplay Handling**: Browsers block unmuted HTML5 video autoplay without prior user interaction. Displays start muted by default with an interactive banner prompt to enable audio.

### 5.2 What I'd Do With More Time
- **Clock Drift / NTP Synchronization**: Implement NTP-style round-trip time (RTT) offset calculation to adjust `Date.now()` across distinct physical machine clocks.
- **WebRTC DataChannels**: Replace WebSocket transport with low-latency WebRTC data channels for sub-50ms peer-to-peer sync.
- **Video Preloading & Buffer Sensing**: Monitor `<video>.buffered` ranges and coordinate pre-buffering before triggering synchronous `PLAY`.
