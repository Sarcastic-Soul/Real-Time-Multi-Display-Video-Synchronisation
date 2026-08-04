import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-10 z-10">
        {/* Title Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-mono font-bold tracking-wide uppercase shadow-lg shadow-cyan-500/5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Server-Authoritative Synchronization Architecture
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
            Real-Time Multi-Display Video Sync
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            High-precision video synchronization system driving video playback across multiple display endpoints with automatic drift detection, soft rate scaling, and hard seek resynchronization.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {/* Master Controller Link */}
          <Link
            href="/controller"
            className="group relative p-6 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 backdrop-blur-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 010 4m-6 8a2 2 0 100-4m0 4a2 2 0 010-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 010-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                Master Controller Dashboard
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">→</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Central control panel to select videos, trigger play/pause/seek/restart commands, and monitor real-time connected displays and drift metrics.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-cyan-400">
              <span>Route: /controller</span>
              <span className="bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-300">Authoritative</span>
            </div>
          </Link>

          {/* Display Client Launcher */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">
                Launch Display Clients
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Open display windows that render video and synchronize in real-time with automatic drift correction & on-screen HUD diagnostics.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/display/disp-1"
                  target="_blank"
                  className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1"
                >
                  Display #1 ↗
                </Link>
                <Link
                  href="/display/disp-2"
                  target="_blank"
                  className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1"
                >
                  Display #2 ↗
                </Link>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span>Route: /display/:id</span>
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300">Client HUD</span>
            </div>
          </div>
        </div>

        {/* Footnote instruction */}
        <div className="pt-4 border-t border-slate-900 text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Recommended test flow: Open Controller + 2 Display Tabs side-by-side.
        </div>
      </div>
    </main>
  );
}
