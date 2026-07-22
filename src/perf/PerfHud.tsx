/**
 * PerfHud — Dev/preview-only overlay showing per-route navigation timing.
 * Toggle: Ctrl+Shift+P (or Cmd+Shift+P). Mirrors MediaDevHud's pattern.
 * Production-safe: returns null unless ENABLED.
 */

import React, { useEffect, useState, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { navTiming, isPerfEnabled, subscribePerfLive, type NavTransaction } from './navTiming';
import { Z } from '@/config/zIndex';
import { VideoPool } from '@/video/pool/VideoPool';
import { getVideoTelemetryStats } from '@/video/telemetry';


type Summary = ReturnType<typeof navTiming.getRecent>[number];

const TIER = (ms: number, green: number, amber: number) =>
  ms <= green ? '#4ade80' : ms <= amber ? '#fbbf24' : '#f87171';

export const PerfHud = memo(function PerfHud() {
  const [, forcePerf] = useState(0);
  useEffect(() => subscribePerfLive(() => forcePerf((n) => n + 1)), []);
  const enabled = isPerfEnabled();
  const [expanded, setExpanded] = useState(false);
  const [snap, setSnap] = useState<{ current: NavTransaction | null; recent: Summary[] }>(() => ({
    current: navTiming.getCurrent(),
    recent: navTiming.getRecent(),
  }));


  // Keybinding (Ctrl/Cmd + Shift + P)
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setExpanded((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    return navTiming.subscribe((s) => setSnap({ current: s.current, recent: [...s.recent] }));
  }, [enabled]);

  const close = useCallback(() => setExpanded(false), []);

  if (!enabled) return null;

  if (typeof document === 'undefined') return null;

  if (!expanded) {
    return createPortal(
      <button
        onClick={() => setExpanded(true)}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: Z.logHud,
          padding: '2px 6px',
          fontSize: 10,
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.7)',
          color: '#67e8f9',
          border: '1px solid rgba(103,232,249,0.3)',
          borderRadius: 4,
          backdropFilter: 'blur(4px)',
          pointerEvents: 'auto',
        }}
        aria-label="Open PerfHud"
      >
        PERF
      </button>,
      document.body
    );
  }


  const cur = snap.current;
  const recent = snap.recent;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: Z.logHud,
        width: 320,
        maxHeight: '60vh',
        overflow: 'auto',
        padding: 8,
        background: 'rgba(0,0,0,0.82)',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 1.4,
        border: '1px solid rgba(103,232,249,0.3)',
        borderRadius: 6,
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid rgba(103,232,249,0.2)' }}>
        <span style={{ color: '#67e8f9', fontWeight: 600 }}>PerfHud · navTiming</span>
        <button onClick={close} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>×</button>
      </div>

      {cur && (
        <div style={{ marginBottom: 8, padding: 4, background: 'rgba(103,232,249,0.06)', borderRadius: 4 }}>
          <div style={{ color: '#fbbf24' }}>LIVE nav#{cur.id} {cur.path}</div>
          <div style={{ color: '#94a3b8' }}>
            marks: {Object.keys(cur.marks).join(', ')} · headerMounts:{cur.headerMounts} · rootMounts:{cur.pageRootMounts}
          </div>
        </div>
      )}

      {recent.length === 0 && <div style={{ color: '#64748b' }}>No navigations yet. Navigate the app.</div>}

      {recent.map((s) => (
        <div key={s.id} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: s.flagged ? '#f87171' : '#e2e8f0' }}>
              #{s.id} {s.path}
            </span>
            <span style={{ color: TIER(s.total, 400, 1000) }}>{s.total}ms</span>
          </div>
          <PhaseBar s={s} />
          <div style={{ color: '#94a3b8' }}>
            CLS <span style={{ color: TIER(s.cls * 1000, 50, 100) }}>{s.cls}</span>
            {' · '}header:<span style={{ color: s.headerFlash > 0 ? '#f87171' : '#4ade80' }}>{s.headerFlash > 0 ? `FLASH(${s.headerFlash + 1})` : 'OK'}</span>
            {' · '}skel:<span style={{ color: s.skeletonVerdict === 'OK' ? '#4ade80' : s.skeletonVerdict === 'NA' ? '#64748b' : '#f87171' }}>{s.skeletonVerdict}</span>
            {' · '}mounts:<span style={{ color: s.doubleMount ? '#f87171' : '#4ade80' }}>{s.mounts}</span>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );

});

function PhaseBar({ s }: { s: Summary }) {
  const total = Math.max(1, s.total);
  const seg = (ms: number, color: string, label: string) =>
    ms > 0 ? (
      <div
        key={label}
        title={`${label} ${ms}ms`}
        style={{ width: `${(ms / total) * 100}%`, background: color, height: 4 }}
      />
    ) : null;
  return (
    <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', margin: '3px 0', background: 'rgba(148,163,184,0.15)' }}>
      {seg(s.lazy, '#a78bfa', 'lazy')}
      {seg(s.skeleton, '#64748b', 'skeleton')}
      {seg(s.data, '#fbbf24', 'data')}
      {seg(s.paint, '#4ade80', 'paint')}
    </div>
  );
}

export default PerfHud;
