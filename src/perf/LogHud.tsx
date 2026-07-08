// On-screen log viewer for on-device testing. Tap the floating button to open.
// Production-safe: returns null unless DEV || ?perf=1. Mirrors PerfHud.
import React, { useEffect, useState, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { consoleCapture, type LogLine } from './consoleCapture';
import { subscribePerfLive } from './navTiming';
import { Z } from '@/config/zIndex';



const LEVEL_COLOR: Record<LogLine['level'], string> = {
  log: '#e5e7eb',
  info: '#67e8f9',
  warn: '#fbbf24',
  error: '#f87171',
  debug: '#9ca3af',
};

const btn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  fontFamily: 'monospace',
  background: 'rgba(255,255,255,0.08)',
  color: '#67e8f9',
  border: '1px solid rgba(103,232,249,0.35)',
  borderRadius: 4,
  cursor: 'pointer',
};

export const LogHud = memo(function LogHud() {
  const [, forceShow] = useState(0);
  useEffect(() => subscribePerfLive(() => forceShow((n) => n + 1)), []);
  const enabled = consoleCapture.isEnabled();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    if (!enabled || !open) return;
    return consoleCapture.subscribe(() => force((n) => n + 1));
  }, [enabled, open]);

  const copy = useCallback(async () => {
    const text = consoleCapture.asText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* ignore */ }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, []);

  if (!enabled) return null;
  if (typeof document === 'undefined') return null;

  if (!open) {
    return createPortal(
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 8,
          zIndex: Z.logHud,
          padding: '6px 10px',
          fontSize: 12,
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.78)',
          color: '#67e8f9',
          border: '1px solid rgba(103,232,249,0.35)',
          borderRadius: 6,
        }}
        aria-label="Open LogHud"
      >
        LOG
      </button>,
      document.body
    );
  }


  const lines = consoleCapture.getLines();
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.logHud,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        color: '#e5e7eb',
        fontFamily: 'monospace',
        fontSize: 11,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '10px 10px calc(10px + env(safe-area-inset-top, 0px))',
          paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
          borderBottom: '1px solid rgba(103,232,249,0.2)',
          background: 'rgba(0,0,0,0.95)',
        }}
      >
        <button onClick={copy} style={btn}>{copied ? 'COPIED' : 'COPY'}</button>
        <button onClick={() => { consoleCapture.clear(); force((n) => n + 1); }} style={btn}>CLEAR</button>
        <span style={{ color: '#94a3b8', flex: 1 }}>{lines.length} lines</span>
        <button onClick={() => setOpen(false)} style={btn}>CLOSE</button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 10px calc(8px + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
          lineHeight: 1.4,
        }}
      >
        {lines.map((l, i) => (
          <div key={i} style={{ color: LEVEL_COLOR[l.level], whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <span style={{ color: '#64748b' }}>+{l.t}ms</span> {l.text}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
});


export default LogHud;
