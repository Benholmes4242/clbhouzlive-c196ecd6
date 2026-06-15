import { useEffect, useState } from "react";
import {
  subscribeToDebugLogs,
  clearDebugLogs,
  enableVideoDebug,
  isVideoDebugOn,
  type DebugLogEntry,
} from "@/media/mobileVideoDebug";

/**
 * Caterpillar (🐛) debug panel for the FULLSCREEN viewer.
 * Mirrors VideoDebugPanel (the 🐞 feed panel) but lives inside the fullscreen
 * overlay so it's only present when the immersive viewer is open. Same
 * bottom-left position, distinct emoji + accent so the two are never confused.
 * Surfaces the same TILE/POOL traces PLUS the fullscreen timing category 'FS'.
 */
export default function FullscreenDebugPanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => isVideoDebugOn());
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    const unsub = subscribeToDebugLogs(setLogs);
    return () => { unsub(); };
  }, [open]);

  const handleToggle = () => {
    if (!enabled) { enableVideoDebug(); setEnabled(true); }
    setOpen(o => !o);
  };

  const levelColor = (lv: DebugLogEntry["level"]) => {
    switch (lv) {
      case "error": return "#ff6b6b";
      case "warning": return "#ffd166";
      case "success": return "#06d6a0";
      default: return "#a0c4ff";
    }
  };

  const recent = logs.slice(-60).reverse();

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label="Toggle fullscreen video debug panel"
        style={{
          position: "fixed",
          left: 8,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
          width: 28, height: 28, borderRadius: 14,
          background: open ? "#F7931E" : "rgba(0,0,0,0.55)",
          color: "#fff", border: "1px solid rgba(255,255,255,0.25)",
          fontSize: 14, lineHeight: "26px", textAlign: "center", padding: 0,
          zIndex: 2147483647, touchAction: "manipulation",
        }}
      >
        🐛
      </button>
      {open && (
        <div
          style={{
            position: "fixed", left: 4, right: 4,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 44px)",
            maxHeight: "55vh", background: "rgba(0,0,0,0.88)", color: "#fff",
            border: "1px solid rgba(247,147,30,0.5)", borderRadius: 8,
            zIndex: 2147483646, display: "flex", flexDirection: "column",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            <span style={{ fontWeight: 600 }}>🐛 fullscreen debug · {logs.length}</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button onClick={() => clearDebugLogs()}
                style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
                         borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>clear</button>
              <button
                onClick={() => {
                  const text = logs.map(l => `${l.formattedTime} [${l.category}] ${l.message}`).join('\n');
                  navigator.clipboard?.writeText(text).then(() => {}, () => {
                    const ta = document.createElement('textarea');
                    ta.value = text; document.body.appendChild(ta); ta.select();
                    try { document.execCommand('copy'); } catch {} document.body.removeChild(ta);
                  });
                }}
                style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
                         borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>copy</button>
              <button onClick={() => setOpen(false)}
                style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
                         borderRadius: 4, padding: "2px 6px", fontSize: 10 }}>close</button>
            </span>
          </div>
          <div style={{ overflowY: "auto", padding: "4px 8px 8px", WebkitOverflowScrolling: "touch" }}>
            {recent.length === 0 && (
              <div style={{ opacity: 0.6, padding: "8px 0" }}>
                Waiting for events… open &amp; swipe the fullscreen viewer.
              </div>
            )}
            {recent.map(l => (
              <div key={l.id} style={{ padding: "2px 0", lineHeight: 1.35 }}>
                <span style={{ opacity: 0.55 }}>{l.formattedTime}</span>{" "}
                <span style={{ color: levelColor(l.level) }}>[{l.category}]</span>{" "}
                <span>{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
