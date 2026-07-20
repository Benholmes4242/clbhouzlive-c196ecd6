/**
 * AudioDebugHud — flag-gated on-device HUD for the V1 Audio + Continuity
 * debug session. Same shape as the retired fsv2 HUD:
 *   - floating pill when idle (top-left, below PERF)
 *   - expanded panel with a live SUMMARY line + ring-buffer timeline
 *   - Copy button dumps the transcript to the clipboard
 *
 * Zero-cost when FLAGS.audioDebug is false — returns null immediately, no
 * subscriptions, no timers.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Z } from '@/config/zIndex';
import {
  audioDebugEnabled,
  buildAudioLogText,
  clearEntries,
  getEntries,
  getSummary,
  logAudio,
  setSummary,
  subscribe,
  type AudioLogEntry,
  type AudioSummary,
} from '@/perf/audioDebug';
import { useSessionAudio, getLastUnmuteGestureTs } from '@/audio/sessionAudioStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { VideoEngine } from '@/video/VideoEngine';
import { feedLaneRoles } from '@/video/feedLaneRoles';

const HUD_BORDER = '1px solid rgba(251, 191, 36, 0.35)';

export const AudioDebugHud = memo(function AudioDebugHud() {
  const enabled = audioDebugEnabled();
  const [expanded, setExpanded] = useState(false);
  const [, force] = useState(0);

  // Subscribe to the buffer so every logAudio() re-renders the panel.
  useEffect(() => {
    if (!enabled) return;
    return subscribe(() => force((n) => n + 1));
  }, [enabled]);

  // Session mute changes — mirror into the timeline + summary.
  useEffect(() => {
    if (!enabled) return;
    return useSessionAudio.subscribe((s, prev) => {
      if (prev && prev.isMuted === s.isMuted) return;
      logAudio('session.change', {
        isMuted: s.isMuted,
        lastUnmuteGestureTs: getLastUnmuteGestureTs(),
      });
      setSummary({
        sessionMuted: s.isMuted,
        msSinceGesture: gestureAge(),
      });
    });
  }, [enabled]);

  // Watch the fullscreen store for open→close cycles so we can attach
  // media-event listeners to whichever lane is live (borrow lane or the
  // canonical 'fullscreen' lane on cold opens).
  useEffect(() => {
    if (!enabled) return;
    let detach: (() => void) | null = null;
    const attach = () => {
      detach?.();
      detach = null;
      const st = useFullscreenFeedStore.getState();
      if (!st.isOpen) return;
      const laneId = st.borrow ? st.borrow.laneId : 'fullscreen';
      const el = (VideoEngine as unknown as {
        _debugGetElement?: (id: string) => HTMLMediaElement | null;
      })._debugGetElement?.(laneId) ?? null;
      if (!el) return;
      setSummary({
        laneId,
        mode: st.borrow ? 'borrow' : 'cold',
        laneMuted: el.muted,
        laneVolume: el.volume,
        laneCurrentTime: +el.currentTime.toFixed(2),
        lanePaused: el.paused,
      });
      const onVolume = () => {
        logAudio('el.volumechange', {
          laneId, muted: el.muted, volume: el.volume,
        });
        setSummary({ laneMuted: el.muted, laneVolume: el.volume });
      };
      const onPlay = () => {
        logAudio('el.play', { laneId, currentTime: +el.currentTime.toFixed(3) });
        setSummary({ lanePaused: false });
      };
      const onPause = () => {
        logAudio('el.pause', { laneId, currentTime: +el.currentTime.toFixed(3) });
        setSummary({ lanePaused: true });
      };
      el.addEventListener('volumechange', onVolume);
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      detach = () => {
        el.removeEventListener('volumechange', onVolume);
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
      };
    };
    // Initial attach + re-attach on any store change (borrow flips, close).
    attach();
    const unsubStore = useFullscreenFeedStore.subscribe(attach);
    return () => {
      unsubStore();
      detach?.();
    };
  }, [enabled]);

  // 250ms live summary tick — panel-only (drives on-screen numbers).
  useEffect(() => {
    if (!enabled || !expanded) return;
    const iv = window.setInterval(() => {
      const st = useFullscreenFeedStore.getState();
      const laneId = st.isOpen ? (st.borrow ? st.borrow.laneId : 'fullscreen') : null;
      const el = laneId
        ? ((VideoEngine as unknown as {
            _debugGetElement?: (id: string) => HTMLMediaElement | null;
          })._debugGetElement?.(laneId) ?? null)
        : null;
      setSummary({
        sessionMuted: useSessionAudio.getState().isMuted,
        msSinceGesture: gestureAge(),
        laneId,
        mode: st.isOpen ? (st.borrow ? 'borrow' : 'cold') : null,
        laneMuted: el ? el.muted : null,
        laneVolume: el ? el.volume : null,
        laneCurrentTime: el ? +el.currentTime.toFixed(2) : null,
        lanePaused: el ? el.paused : null,
      });
      force((n) => n + 1);
    }, 250);
    return () => window.clearInterval(iv);
  }, [enabled, expanded]);

  // 1s SLOT heartbeat — runs whenever the flag is on, independent of the
  // panel being open. Emits one `audio.heartbeat` line per second saying
  // who the visible speaker is, whether they're actually audible, and
  // whether anyone else is squatting on the slot. A silent-video second
  // reads as sessionMuted=0 + activeElMuted=1 + unmutedLanes=[…].
  useEffect(() => {
    if (!enabled) return;
    const iv = window.setInterval(() => {
      const engine = VideoEngine as unknown as {
        _debugGetLanesSnapshot?: () => Array<{
          laneId: string; postId: string | null; muted: boolean;
          paused: boolean; currentTime: number; borrowed: boolean;
        }>;
      };
      const snap = engine._debugGetLanesSnapshot?.() ?? [];
      const fsSt = useFullscreenFeedStore.getState();
      const sessionMuted = useSessionAudio.getState().isMuted;

      // "Active" speaker = fullscreen borrow lane if open, else the feed
      // lane currently holding the 'active' role.
      let activeLaneId: string | null = null;
      if (fsSt.isOpen) {
        activeLaneId = fsSt.borrow ? fsSt.borrow.laneId : 'fullscreen';
      } else {
        try {
          activeLaneId = feedLaneRoles.laneForRole('active') as string | null;
        } catch { activeLaneId = null; }
      }
      const activeLane = activeLaneId
        ? snap.find((l) => l.laneId === activeLaneId) ?? null
        : null;
      const unmutedLanes = snap.filter((l) => !l.muted).map((l) => l.laneId);
      const borrowedLanes = snap.filter((l) => l.borrowed).map((l) => l.laneId);

      logAudio('audio.heartbeat', {
        activeLaneId,
        activePostId: activeLane?.postId ?? null,
        activeElMuted: activeLane ? activeLane.muted : null,
        activeElPaused: activeLane ? activeLane.paused : null,
        activeCurrentTime: activeLane ? activeLane.currentTime : null,
        sessionMuted,
        unmutedLanes,
        borrowedLanes,
      });

      setSummary({
        sessionMuted,
        msSinceGesture: gestureAge(),
        activeLaneId,
        activePostId: activeLane?.postId ?? null,
        activeElMuted: activeLane ? activeLane.muted : null,
        unmutedLanes,
        borrowedLanes,
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [enabled]);


  const onCopy = useCallback(async () => {
    const txt = buildAudioLogText();
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      // Fallback: dump into a <textarea> so the user can copy manually.
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.top = '10%';
      ta.style.left = '10%';
      ta.style.width = '80%';
      ta.style.height = '60%';
      ta.style.zIndex = String(Z.logHud + 1);
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      setTimeout(() => { ta.remove(); }, 8000);
    }
  }, []);

  if (!enabled) return null;
  if (typeof document === 'undefined') return null;

  if (!expanded) {
    return createPortal(
      <button
        onClick={() => setExpanded(true)}
        style={{
          position: 'fixed',
          top: 34,
          right: 8,
          zIndex: Z.logHud,
          padding: '2px 6px',
          fontSize: 10,
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.7)',
          color: '#fbbf24',
          border: HUD_BORDER,
          borderRadius: 4,
          pointerEvents: 'auto',
        }}
        aria-label="Open AudioDebugHud"
      >
        AUDIO
      </button>,
      document.body,
    );
  }

  const entries = getEntries();
  const summary = getSummary();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 34,
        right: 8,
        zIndex: Z.logHud,
        width: 380,
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.85)',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 1.35,
        border: HUD_BORDER,
        borderRadius: 6,
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 8px', borderBottom: '1px solid rgba(251,191,36,0.2)',
      }}>
        <span style={{ color: '#fbbf24', fontWeight: 700 }}>AUDIO · continuity</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onCopy} style={btnStyle}>Copy</button>
          <button onClick={() => clearEntries()} style={btnStyle}>Clear</button>
          <button onClick={() => setExpanded(false)} style={{ ...btnStyle, color: '#94a3b8' }}>×</button>
        </div>
      </div>

      <SummaryPane summary={summary} />

      <div style={{
        overflowY: 'auto', flex: 1, padding: '4px 8px',
        borderTop: '1px solid rgba(148,163,184,0.15)',
      }}>
        {entries.length === 0 && (
          <div style={{ color: '#64748b', padding: '6px 0' }}>
            No events yet. Tap any video tile.
          </div>
        )}
        {entries.slice().reverse().map((e, i) => (
          <TimelineRow key={entries.length - i} e={e} />
        ))}
      </div>
    </div>,
    document.body,
  );
});

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#fbbf24',
  border: '1px solid rgba(251,191,36,0.3)',
  borderRadius: 3,
  fontSize: 10,
  fontFamily: 'monospace',
  padding: '1px 6px',
  cursor: 'pointer',
};

function SummaryPane({ summary }: { summary: AudioSummary }) {
  const gestureTxt = summary.msSinceGesture == null
    ? 'never'
    : `${(summary.msSinceGesture / 1000).toFixed(1)}s ago`;
  const tilePos = summary.tilePos == null ? '?' : summary.tilePos.toFixed(1);
  const fsPos   = summary.fsPos   == null ? '?' : summary.fsPos.toFixed(1);
  const cont =
    summary.continuityOk == null ? ''
    : summary.continuityOk ? ' ✓' : ' ✗';
  return (
    <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div>
        <span style={{ color: '#fbbf24' }}>SESSION</span>{' '}
        <span style={{ color: summary.sessionMuted ? '#94a3b8' : '#4ade80' }}>
          {summary.sessionMuted ? 'muted' : 'unmuted'}
        </span>{' '}
        <span style={{ color: '#64748b' }}>(gesture {gestureTxt})</span>
      </div>
      <div>
        <span style={{ color: '#fbbf24' }}>EL</span>{' '}
        muted=<span style={{ color: summary.laneMuted ? '#f87171' : '#4ade80' }}>
          {String(summary.laneMuted)}
        </span>{' '}
        vol={summary.laneVolume?.toFixed(2) ?? '-'}{' '}
        t={summary.laneCurrentTime?.toFixed(2) ?? '-'}{' '}
        {summary.lanePaused == null ? '' : summary.lanePaused ? 'paused' : 'playing'}
      </div>
      <div>
        <span style={{ color: '#fbbf24' }}>MODE</span>{' '}
        {summary.mode ?? '—'}
        {summary.laneId ? ` ${summary.laneId}` : ''}
      </div>
      <div>
        <span style={{ color: '#fbbf24' }}>POS</span>{' '}
        tile {tilePos}s → fs {fsPos}s{cont}
      </div>
    </div>
  );
}

function TimelineRow({ e }: { e: AudioLogEntry }) {
  const ms = e.ms == null ? '   -' : `+${String(e.ms).padStart(4, ' ')}`;
  return (
    <div style={{ display: 'flex', gap: 6, padding: '1px 0', borderBottom: '1px dashed rgba(148,163,184,0.08)' }}>
      <span style={{ color: '#64748b', width: 52, flexShrink: 0 }}>{ms}ms</span>
      <span style={{ color: '#a78bfa', width: 60, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.openId ?? '-'}</span>
      <span style={{ color: '#fbbf24', flexShrink: 0 }}>{e.event}</span>
      <span style={{ color: '#cbd5e1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {shortJson(e.data)}
      </span>
    </div>
  );
}

function shortJson(o: Record<string, unknown>) {
  try {
    return Object.keys(o).map((k) => `${k}=${fmtVal(o[k])}`).join(' ');
  } catch { return '{...}'; }
}
function fmtVal(v: unknown) {
  if (v == null) return String(v);
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'string') return v.length > 24 ? v.slice(0, 24) + '…' : v;
  return JSON.stringify(v);
}

function gestureAge(): number | null {
  const ts = getLastUnmuteGestureTs();
  return ts > 0 ? Date.now() - ts : null;
}

export default AudioDebugHud;
