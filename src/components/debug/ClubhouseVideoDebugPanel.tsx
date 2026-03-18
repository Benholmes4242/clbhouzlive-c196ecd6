/**
 * ClubhouseVideoDebugPanel
 *
 * YouTube-grade video diagnostics panel for the Clubhouse feed.
 * Activated by tapping the hidden trigger 5× in the top-right corner,
 * or by setting localStorage.setItem('CLBHOUZ_VIDEO_DEBUG', 'true') and refreshing.
 *
 * Tracks per-video:
 *   – HLS quality level history + ABR decisions
 *   – Estimated bandwidth (from HLS.js)
 *   – TTFF (time-to-first-frame) from loadstart → playing
 *   – Buffer health (seconds ahead)
 *   – Stall count + cumulative stall duration
 *   – Fragment load timing (network latency per segment)
 *   – Decoder slot usage
 *   – HLS pool status
 *   – Network effective type
 *   – Full event timeline (every video + HLS event)
 *
 * Drop this file into src/components/debug/ and import it in Clubhouse.tsx:
 *
 *   import ClubhouseVideoDebugPanel from '@/components/debug/ClubhouseVideoDebugPanel';
 *   // Inside the Clubhouse return, just before the closing tag:
 *   <ClubhouseVideoDebugPanel />
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { DecoderLimitManager } from '@/utils/video/DecoderLimitManager';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { hlsBlobCache } from '@/utils/hlsBlobCache';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QualitySwitch {
  ts: number;           // performance.now()
  fromLevel: number;
  toLevel: number;
  fromHeight: number;
  toHeight: number;
  reason: 'abr' | 'manual' | 'error-recovery' | 'initial';
  bandwidthKbps: number;
}

interface FragStat {
  ts: number;
  level: number;
  height: number;
  sn: number | string;
  loadMs: number;
  sizeKb: number;
  bitrateKbps: number;
}

interface StallEvent {
  ts: number;
  durationMs: number;
  bufferLenAtStall: number;
}

interface VideoSession {
  videoId: string;           // Cloudflare UID or internal ID (first 12 chars shown)
  startTs: number;           // performance.now() when HLS attached
  ttffMs: number | null;     // loadstart → first 'playing'
  loadstartTs: number | null;
  firstPlayingTs: number | null;

  // Current state
  currentLevelHeight: number;
  currentLevelIdx: number;
  availableLevels: { idx: number; height: number; bitrateKbps: number }[];
  bandwidthKbps: number;
  bufferAheadSec: number;
  readyState: number;
  networkState: number;
  paused: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;

  // History
  qualitySwitches: QualitySwitch[];
  fragStats: FragStat[];       // last 20 fragments
  stallEvents: StallEvent[];   // all stalls this session
  totalStallMs: number;
  eventTimeline: { ts: number; event: string; detail?: string }[];

  // HLS.js instance ref (live)
  hlsInstance: any | null;
}

// ─── Global registry so the panel can reach into active HLS instances ────────

// We register HLS instances by videoId when they are created in UnifiedVideoPlayer.
// The panel polls this registry.
const HLS_REGISTRY = new Map<string, { hls: any; video: HTMLVideoElement }>();

export function registerHlsForDebug(videoId: string, hls: any, video: HTMLVideoElement) {
  HLS_REGISTRY.set(videoId, { hls, video });
}

export function unregisterHlsForDebug(videoId: string) {
  HLS_REGISTRY.delete(videoId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtKbps(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
  return `${Math.round(kbps)} Kbps`;
}

function fmtBuf(sec: number): string {
  return `${sec.toFixed(1)}s`;
}

function relTime(ts: number, startTs: number): string {
  return `+${((ts - startTs) / 1000).toFixed(2)}s`;
}

function qualityColor(height: number): string {
  if (height >= 2160) return '#00ff88';
  if (height >= 1080) return '#4ade80';
  if (height >= 720)  return '#facc15';
  if (height >= 480)  return '#fb923c';
  return '#f87171';
}

function networkEffectiveType(): string {
  const conn = (navigator as any).connection;
  if (!conn) return 'unknown';
  return `${conn.effectiveType ?? '?'} (${conn.downlink ?? '?'} Mbps dl, rtt ${conn.rtt ?? '?'}ms)`;
}

// ─── Session builder from live HLS instance ──────────────────────────────────

function buildSession(
  videoId: string,
  entry: { hls: any; video: HTMLVideoElement },
  prev: VideoSession | undefined,
): VideoSession {
  const { hls, video } = entry;

  const levels = hls ? (hls.levels ?? []).map((l: any, i: number) => ({
    idx: i,
    height: l.height ?? 0,
    bitrateKbps: Math.round((l.bitrate ?? 0) / 1000),
  })) : [];

  const currentLevelIdx = hls ? (hls.currentLevel ?? -1) : -1;
  const currentLevel = levels[currentLevelIdx] ?? { height: 0, bitrateKbps: 0 };

  // Buffer ahead
  let bufferAheadSec = 0;
  try {
    const buf = video.buffered;
    const ct = video.currentTime;
    for (let i = 0; i < buf.length; i++) {
      if (buf.start(i) <= ct && ct <= buf.end(i)) {
        bufferAheadSec = Math.max(0, buf.end(i) - ct);
        break;
      }
    }
  } catch { /* ignore */ }

  // Bandwidth from HLS.js EWMA (unavailable on native path)
  const bandwidthKbps = hls ? Math.round((hls.bandwidthEstimate ?? 0) / 1000) : 0;

  const base: VideoSession = {
    videoId,
    startTs: prev?.startTs ?? performance.now(),
    ttffMs: prev?.ttffMs ?? null,
    loadstartTs: prev?.loadstartTs ?? null,
    firstPlayingTs: prev?.firstPlayingTs ?? null,
    currentLevelHeight: currentLevel.height,
    currentLevelIdx,
    availableLevels: levels,
    bandwidthKbps,
    bufferAheadSec,
    readyState: video.readyState,
    networkState: video.networkState,
    paused: video.paused,
    muted: video.muted,
    currentTime: video.currentTime,
    duration: isFinite(video.duration) ? video.duration : 0,
    qualitySwitches: prev?.qualitySwitches ?? [],
    fragStats: prev?.fragStats ?? [],
    stallEvents: prev?.stallEvents ?? [],
    totalStallMs: prev?.totalStallMs ?? 0,
    eventTimeline: prev?.eventTimeline ?? [],
    hlsInstance: hls,
  };

  return base;
}

// ─── Panel component ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'CLBHOUZ_VIDEO_DEBUG';

export default function ClubhouseVideoDebugPanel() {
  const [visible, setVisible] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  // Listen for toggle event from the Test nav button
  useEffect(() => {
    const handler = () => {
      setVisible(localStorage.getItem(STORAGE_KEY) === 'true');
    };
    window.addEventListener('clbhouz-debug-toggle', handler);
    return () => window.removeEventListener('clbhouz-debug-toggle', handler);
  }, []);

  const [tab, setTab] = useState<'live' | 'quality' | 'frags' | 'stalls' | 'timeline' | 'system'>('live');
  const [sessions, setSessions] = useState<Map<string, VideoSession>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsListeners = useRef<Map<string, () => void>>(new Map());

  // ── Hidden tap trigger (5 taps in top-right within 2s) ──
  const handleTriggerTap = useCallback(() => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setVisible(v => {
        const next = !v;
        try { localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false'); } catch {}
        return next;
      });
    }
  }, []);

  // ── Attach HLS event listeners to every registered instance ──
  const attachListeners = useCallback((videoId: string, entry: { hls: any; video: HTMLVideoElement }) => {
    if (hlsListeners.current.has(videoId)) return; // already attached

    const { hls, video } = entry;
    const startTs = performance.now();

    // Helpers to mutate session immutably
    const mutate = (fn: (s: VideoSession) => Partial<VideoSession>) => {
      setSessions(prev => {
        const current = prev.get(videoId);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(videoId, { ...current, ...fn(current) });
        return next;
      });
    };

    const addEvent = (event: string, detail?: string) => {
      mutate(s => ({
        eventTimeline: [
          ...s.eventTimeline.slice(-199), // keep last 200
          { ts: performance.now(), event, detail },
        ],
      }));
    };

    // ── Video element events ──
    const videoHandlers: Record<string, (e?: Event) => void> = {
      loadstart: () => {
        mutate(s => ({ loadstartTs: performance.now() }));
        addEvent('loadstart');
      },
      loadedmetadata: () => addEvent('loadedmetadata', `${video.videoWidth}×${video.videoHeight}`),
      loadeddata: () => addEvent('loadeddata'),
      canplay: () => addEvent('canplay'),
      canplaythrough: () => addEvent('canplaythrough'),
      playing: () => {
        mutate(s => {
          const now = performance.now();
          const ttffMs = s.ttffMs === null && s.loadstartTs !== null
            ? now - s.loadstartTs
            : s.ttffMs;
          return { firstPlayingTs: s.firstPlayingTs ?? now, ttffMs };
        });
        addEvent('▶ playing');
      },
      waiting: () => {
        mutate(s => ({
          stallEvents: [...s.stallEvents, { ts: performance.now(), durationMs: 0, bufferLenAtStall: s.bufferAheadSec }],
        }));
        addEvent('⏳ waiting/stall');
      },
      stalled: () => addEvent('🚫 stalled'),
      suspend: () => addEvent('💤 suspend'),
      pause: () => addEvent('⏸ pause'),
      play: () => addEvent('▶ play'),
      ended: () => addEvent('🏁 ended'),
      error: () => {
        const err = video.error;
        addEvent('❌ error', `${err?.code ?? '?'}: ${err?.message ?? '?'}`);
      },
    };

    Object.entries(videoHandlers).forEach(([evt, fn]) => {
      video.addEventListener(evt, fn, { passive: true });
    });

    // ── HLS.js events (only when hls instance exists — not on native iOS path) ──
    const onManifestParsed = (_: string, data: any) => {
      const levels = (hls.levels ?? []).map((l: any, i: number) => ({
        idx: i, height: l.height ?? 0, bitrateKbps: Math.round((l.bitrate ?? 0) / 1000),
      }));
      mutate(s => ({ availableLevels: levels }));
      addEvent('📋 MANIFEST_PARSED', `${levels.length} levels: ${levels.map(l => `${l.height}p`).join(', ')}`);
    };

    let lastLevelIdx = -1;
    const onLevelSwitched = (_: string, data: any) => {
      const toIdx = data.level;
      const toLevel = hls.levels?.[toIdx];
      const fromLevel = hls.levels?.[lastLevelIdx];
      const bw = Math.round((hls.bandwidthEstimate ?? 0) / 1000);
      const sw: QualitySwitch = {
        ts: performance.now(),
        fromLevel: lastLevelIdx,
        toLevel: toIdx,
        fromHeight: fromLevel?.height ?? 0,
        toHeight: toLevel?.height ?? 0,
        reason: lastLevelIdx === -1 ? 'initial' : 'abr',
        bandwidthKbps: bw,
      };
      lastLevelIdx = toIdx;
      mutate(s => ({
        qualitySwitches: [...s.qualitySwitches, sw],
        currentLevelIdx: toIdx,
        currentLevelHeight: toLevel?.height ?? 0,
      }));
      addEvent(
        `🎚 LEVEL_SWITCH`,
        `${sw.fromHeight}p → ${sw.toHeight}p (bw: ${fmtKbps(bw)})`,
      );
    };

    const onFragLoaded = (_: string, data: any) => {
      const frag = data.frag;
      const loadMs = data.frag?.stats?.loading?.end - data.frag?.stats?.loading?.start;
      const sizeKb = Math.round((frag?.stats?.total ?? 0) / 1024);
      const height = hls.levels?.[frag?.level]?.height ?? 0;
      const bitrateKbps = sizeKb > 0 && loadMs > 0 ? Math.round((sizeKb * 8) / (loadMs / 1000)) : 0;
      const stat: FragStat = {
        ts: performance.now(),
        level: frag?.level ?? -1,
        height,
        sn: frag?.sn ?? '?',
        loadMs: Math.round(loadMs ?? 0),
        sizeKb,
        bitrateKbps,
      };
      mutate(s => ({ fragStats: [...s.fragStats.slice(-19), stat] }));
    };

    const onError = (_: string, data: any) => {
      addEvent(
        data.fatal ? '💀 HLS FATAL' : '⚠️ HLS error',
        `${data.type}: ${data.details}`,
      );
    };

    const onBufferAppended = () => {
      // Resolve any open stall
      mutate(s => {
        if (s.stallEvents.length === 0) return {};
        const last = s.stallEvents[s.stallEvents.length - 1];
        if (last.durationMs !== 0) return {};
        const now = performance.now();
        const durMs = now - last.ts;
        const updated = [...s.stallEvents];
        updated[updated.length - 1] = { ...last, durationMs: durMs };
        return {
          stallEvents: updated,
          totalStallMs: s.totalStallMs + durMs,
        };
      });
    };

    if (hls) {
      hls.on('hlsManifestParsed', onManifestParsed);
      hls.on('hlsLevelSwitched', onLevelSwitched);
      hls.on('hlsFragLoaded', onFragLoaded);
      hls.on('hlsError', onError);
      hls.on('hlsBufferAppended', onBufferAppended);
    }

    // Cleanup fn
    const cleanup = () => {
      Object.entries(videoHandlers).forEach(([evt, fn]) => {
        video.removeEventListener(evt, fn);
      });
      if (hls) {
        hls.off('hlsManifestParsed', onManifestParsed);
        hls.off('hlsLevelSwitched', onLevelSwitched);
        hls.off('hlsFragLoaded', onFragLoaded);
        hls.off('hlsError', onError);
        hls.off('hlsBufferAppended', onBufferAppended);
      }
    };

    hlsListeners.current.set(videoId, cleanup);
  }, []);

  // ── Poll loop: discover new HLS instances, refresh session state ──
  useEffect(() => {
    if (!visible) return;

    const tick = () => {
      setSessions(prev => {
        const next = new Map<string, VideoSession>();

        HLS_REGISTRY.forEach((entry, videoId) => {
          // Attach listeners if not already done
          attachListeners(videoId, entry);

          // Build/refresh session
          const session = buildSession(videoId, entry, prev.get(videoId));
          next.set(videoId, session);
        });

        // Auto-select first if nothing selected
        if (next.size > 0 && (!selectedId || !next.has(selectedId))) {
          setSelectedId(next.keys().next().value);
        }

        return next;
      });
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [visible, attachListeners, selectedId]);

  // ── Cleanup listeners when sessions disappear ──
  useEffect(() => {
    hlsListeners.current.forEach((cleanup, id) => {
      if (!HLS_REGISTRY.has(id)) {
        cleanup();
        hlsListeners.current.delete(id);
      }
    });
  }, [sessions]);

  // ── System stats (polled separately, not per-video) ──
  const [systemStats, setSystemStats] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!visible) return;
    const refresh = () => {
      const pool = HLSPoolManager.getStats();
      const decoder = DecoderLimitManager.getSlots?.() ?? [];
      const rt = MediaRuntime.getDebugInfo();
      const rtTel = MediaRuntime.getTelemetryStats();
      const blobStats = hlsBlobCache.getOverallStats?.() ?? { videoCount: 0, readyCount: 0, totalBytes: 0, totalSegments: 0 };
      const mem = (performance as any).memory;
      const conn = (navigator as any).connection;

      setSystemStats({
        'HLS pool size': `${pool.poolSize}`,
        'Decoder slots': `${decoder.length} / 3`,
        'Decoder IDs': decoder.map((d: any) => d.videoId?.slice(0, 6)).join(', ') || '—',
        'Runtime registry': `${rt.registrySize}`,
        'Warm pool': `${rt.warmPoolSize}`,
        'Active surface': rt.activeSurface ?? '—',
        'Active media': rt.activeMediaId?.slice(0, 8) ?? '—',
        'TTFF (last)': fmtMs(rtTel.lastTtff),
        'Last stall': fmtMs(rtTel.lastBufferingMs),
        'Is buffering': rtTel.isBuffering ? '⏳ YES' : 'no',
        'Blob cache videos': `${blobStats.videoCount} (${blobStats.readyCount} ready)`,
        'Blob cache segments': `${blobStats.totalSegments}`,
        'Blob cache size': `${(blobStats.totalBytes / 1024 / 1024).toFixed(1)} MB`,
        'DOM <video> elements': `${document.querySelectorAll('video').length}`,
        'JS heap used': mem ? `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(0)} / ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB` : '—',
        'Network type': conn ? `${conn.effectiveType ?? '?'} (${conn.downlink ?? '?'} Mbps / rtt ${conn.rtt ?? '?'}ms)` : '—',
        'Navigator platform': navigator.platform,
      });
    };
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [visible]);

  const selected = selectedId ? sessions.get(selectedId) ?? null : null;

  // ── Export ──
  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      ua: navigator.userAgent,
      network: networkEffectiveType(),
      systemStats,
      sessions: Array.from(sessions.values()).map(s => ({
        ...s,
        hlsInstance: undefined, // not serialisable
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clbhouz-video-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden tap trigger — 44×44 touch target in top-right */}
      <div
        onClick={handleTriggerTap}
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 44, height: 44, zIndex: 99999,
          cursor: 'default',
        }}
        aria-hidden
      />

      {visible && (
        <div
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: 11, color: '#e2e8f0',
            backdropFilter: 'blur(8px)',
          }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            // Safe area: push content below the iOS notch/Dynamic Island
            paddingTop: 'calc(env(safe-area-inset-top, 47px) + 8px)',
            paddingBottom: '8px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderBottom: '1px solid #1e293b',
            background: '#0f172a', flexShrink: 0,
          }}>
            <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: 12 }}>
              ◈ CLBHOUZ VIDEO DIAGNOSTICS
            </span>
            <span style={{ color: '#475569', fontSize: 10 }}>
              {sessions.size} active {sessions.size === 1 ? 'session' : 'sessions'}
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={handleExport} style={btnStyle('#1e40af', '#93c5fd')}>
              ↓ EXPORT JSON
            </button>
            <button onClick={() => setVisible(false)} style={btnStyle('#7f1d1d', '#fca5a5')}>
              ✕ CLOSE
            </button>
          </div>

          {/* ── Video session selector ── */}
          {sessions.size > 0 && (
            <div style={{
              display: 'flex', gap: 4, padding: '6px 12px',
              borderBottom: '1px solid #1e293b', flexWrap: 'wrap', flexShrink: 0,
              background: '#0c1221',
            }}>
              {Array.from(sessions.values()).map(s => (
                <button
                  key={s.videoId}
                  onClick={() => setSelectedId(s.videoId)}
                  style={{
                    ...btnStyle(
                      s.videoId === selectedId ? '#0e3a5c' : '#1e293b',
                      s.videoId === selectedId ? '#38bdf8' : '#94a3b8',
                    ),
                    borderColor: s.videoId === selectedId ? '#38bdf8' : 'transparent',
                    borderWidth: 1, borderStyle: 'solid',
                  }}
                >
                  <span style={{ color: qualityColor(s.currentLevelHeight) }}>●</span>
                  {' '}{s.videoId.slice(0, 10)}
                  {' '}
                  <span style={{ opacity: 0.6 }}>{s.currentLevelHeight}p</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Tab bar ── */}
          <div style={{
            display: 'flex', gap: 2, padding: '4px 12px',
            borderBottom: '1px solid #1e293b', flexShrink: 0,
            background: '#0a0f1e',
          }}>
            {(['live', 'quality', 'frags', 'stalls', 'timeline', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  ...btnStyle(tab === t ? '#1e293b' : 'transparent', tab === t ? '#e2e8f0' : '#64748b'),
                  fontWeight: tab === t ? 700 : 400,
                  borderBottom: tab === t ? '2px solid #38bdf8' : '2px solid transparent',
                  borderRadius: 0,
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>

            {sessions.size === 0 && (
              <EmptyState message="No active HLS sessions detected. Scroll to a video in Clubhouse." />
            )}

            {/* ── LIVE tab ── */}
            {tab === 'live' && selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Section title="PLAYBACK STATE">
                  <Grid>
                    <KV k="Video ID" v={selected.videoId.slice(0, 20)} />
                    <KV k="TTFF" v={fmtMs(selected.ttffMs)} highlight={selected.ttffMs !== null && selected.ttffMs > 2000 ? 'warn' : selected.ttffMs !== null && selected.ttffMs < 800 ? 'good' : undefined} />
                    <KV k="Current quality" v={`${selected.currentLevelHeight}p (level ${selected.currentLevelIdx})`} highlight={selected.currentLevelHeight >= 1080 ? 'good' : selected.currentLevelHeight < 480 ? 'warn' : undefined} />
                    <KV k="Bandwidth (EWMA)" v={fmtKbps(selected.bandwidthKbps)} />
                    <KV k="Buffer ahead" v={fmtBuf(selected.bufferAheadSec)} highlight={selected.bufferAheadSec < 1 ? 'warn' : selected.bufferAheadSec > 5 ? 'good' : undefined} />
                    <KV k="Ready state" v={`${selected.readyState} (${['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA'][selected.readyState] ?? '?'})`} />
                    <KV k="Network state" v={`${selected.networkState} (${['EMPTY','IDLE','LOADING','NO_SOURCE'][selected.networkState] ?? '?'})`} />
                    <KV k="Paused" v={selected.paused ? '⏸ YES' : 'no'} />
                    <KV k="Muted" v={selected.muted ? '🔇 YES' : 'no'} />
                    <KV k="Position" v={`${selected.currentTime.toFixed(1)}s / ${selected.duration.toFixed(1)}s`} />
                    <KV k="Total stall time" v={fmtMs(selected.totalStallMs)} highlight={selected.totalStallMs > 2000 ? 'warn' : undefined} />
                    <KV k="Stall count" v={`${selected.stallEvents.length}`} highlight={selected.stallEvents.length > 2 ? 'warn' : undefined} />
                    <KV k="Quality switches" v={`${selected.qualitySwitches.length}`} />
                  </Grid>
                </Section>

                <Section title="AVAILABLE QUALITY LEVELS">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: '#64748b', textAlign: 'left' }}>
                        <Th>Level</Th><Th>Resolution</Th><Th>Bitrate</Th><Th>Active</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.availableLevels.map(l => (
                        <tr key={l.idx} style={{ borderBottom: '1px solid #1e293b', background: l.idx === selected.currentLevelIdx ? '#0e3a5c22' : 'transparent' }}>
                          <Td>{l.idx}</Td>
                          <Td style={{ color: qualityColor(l.height) }}>{l.height}p</Td>
                          <Td>{fmtKbps(l.bitrateKbps)}</Td>
                          <Td>{l.idx === selected.currentLevelIdx ? <span style={{ color: '#4ade80' }}>◉ ACTIVE</span> : '—'}</Td>
                        </tr>
                      ))}
                      {selected.availableLevels.length === 0 && (
                        <tr><td colSpan={4} style={{ color: '#475569', padding: '8px 0' }}>Waiting for manifest…</td></tr>
                      )}
                    </tbody>
                  </table>
                </Section>
              </div>
            )}

            {/* ── QUALITY tab ── */}
            {tab === 'quality' && selected && (
              <Section title={`QUALITY SWITCH HISTORY (${selected.qualitySwitches.length} switches)`}>
                {selected.qualitySwitches.length === 0 && <EmptyState message="No quality switches yet." />}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#64748b', textAlign: 'left' }}>
                      <Th>T+</Th><Th>From</Th><Th>To</Th><Th>Reason</Th><Th>Bandwidth</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.qualitySwitches.map((sw, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <Td style={{ color: '#64748b' }}>{relTime(sw.ts, selected.startTs)}</Td>
                        <Td style={{ color: qualityColor(sw.fromHeight) }}>{sw.fromHeight > 0 ? `${sw.fromHeight}p` : '—'}</Td>
                        <Td style={{ color: qualityColor(sw.toHeight), fontWeight: 700 }}>{sw.toHeight}p</Td>
                        <Td style={{ color: sw.reason === 'error-recovery' ? '#f87171' : '#94a3b8' }}>{sw.reason}</Td>
                        <Td>{fmtKbps(sw.bandwidthKbps)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* ── FRAGS tab ── */}
            {tab === 'frags' && selected && (
              <Section title={`LAST ${selected.fragStats.length} FRAGMENTS`}>
                {selected.fragStats.length === 0 && <EmptyState message="No fragments loaded yet." />}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#64748b', textAlign: 'left' }}>
                      <Th>T+</Th><Th>SN</Th><Th>Level</Th><Th>Size</Th><Th>Load time</Th><Th>Effective bitrate</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.fragStats.map((f, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <Td style={{ color: '#64748b' }}>{relTime(f.ts, selected.startTs)}</Td>
                        <Td>{f.sn}</Td>
                        <Td style={{ color: qualityColor(f.height) }}>{f.height}p</Td>
                        <Td>{f.sizeKb} KB</Td>
                        <Td style={{ color: f.loadMs > 1500 ? '#f87171' : f.loadMs < 300 ? '#4ade80' : '#e2e8f0' }}>{fmtMs(f.loadMs)}</Td>
                        <Td>{fmtKbps(f.bitrateKbps)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* ── STALLS tab ── */}
            {tab === 'stalls' && selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Section title="STALL SUMMARY">
                  <Grid>
                    <KV k="Total stalls" v={`${selected.stallEvents.length}`} highlight={selected.stallEvents.length > 2 ? 'warn' : 'good'} />
                    <KV k="Total stall time" v={fmtMs(selected.totalStallMs)} highlight={selected.totalStallMs > 2000 ? 'warn' : 'good'} />
                    <KV k="Avg stall duration" v={selected.stallEvents.length > 0 ? fmtMs(selected.totalStallMs / selected.stallEvents.filter(s => s.durationMs > 0).length) : '—'} />
                  </Grid>
                </Section>
                <Section title="STALL EVENTS">
                  {selected.stallEvents.length === 0 && <EmptyState message="No stalls detected. 🎉" />}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: '#64748b', textAlign: 'left' }}>
                        <Th>T+</Th><Th>Duration</Th><Th>Buffer at stall</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.stallEvents.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                          <Td style={{ color: '#64748b' }}>{relTime(s.ts, selected.startTs)}</Td>
                          <Td style={{ color: s.durationMs > 1000 ? '#f87171' : '#facc15' }}>
                            {s.durationMs > 0 ? fmtMs(s.durationMs) : '⏳ ongoing'}
                          </Td>
                          <Td>{fmtBuf(s.bufferLenAtStall)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              </div>
            )}

            {/* ── TIMELINE tab ── */}
            {tab === 'timeline' && selected && (
              <Section title={`EVENT TIMELINE (${selected.eventTimeline.length} events)`}>
                {selected.eventTimeline.length === 0 && <EmptyState message="No events yet." />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selected.eventTimeline.map((ev, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 8, padding: '2px 0',
                      borderBottom: '1px solid #0f172a',
                      color: ev.event.includes('❌') || ev.event.includes('💀') ? '#f87171'
                           : ev.event.includes('⏳') || ev.event.includes('🚫') ? '#facc15'
                           : ev.event.includes('▶') ? '#4ade80'
                           : '#94a3b8',
                    }}>
                      <span style={{ color: '#475569', flexShrink: 0, width: 60 }}>
                        {relTime(ev.ts, selected.startTs)}
                      </span>
                      <span style={{ flexShrink: 0, minWidth: 120 }}>{ev.event}</span>
                      {ev.detail && <span style={{ color: '#64748b', flex: 1, wordBreak: 'break-all' }}>{ev.detail}</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── SYSTEM tab ── */}
            {tab === 'system' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Section title="SYSTEM & RUNTIME">
                  <Grid>
                    {Object.entries(systemStats).map(([k, v]) => (
                      <KV key={k} k={k} v={v}
                        highlight={
                          (k === 'Is buffering' && v.includes('YES')) ? 'warn'
                          : (k === 'TTFF (last)' && parseInt(v) > 2000) ? 'warn'
                          : undefined
                        }
                      />
                    ))}
                  </Grid>
                </Section>
                <Section title="USER AGENT">
                  <p style={{ wordBreak: 'break-all', color: '#64748b', lineHeight: 1.5 }}>
                    {navigator.userAgent}
                  </p>
                </Section>
                <Section title="HOW TO READ THIS PANEL">
                  <div style={{ color: '#64748b', lineHeight: 1.8, fontSize: 10 }}>
                    <p>• <span style={{ color: '#4ade80' }}>Green</span> quality = 1080p+. <span style={{ color: '#facc15' }}>Yellow</span> = 720p. <span style={{ color: '#f87171' }}>Red</span> = 480p or below.</p>
                    <p>• TTFF &lt;800ms = excellent. 800ms–2s = acceptable. &gt;2s = needs fixing.</p>
                    <p>• Buffer ahead &gt;5s = healthy. &lt;1s = at risk of stalling.</p>
                    <p>• Fragment load time &lt;300ms = fast. &gt;1500ms = network bottleneck.</p>
                    <p>• Quality switches: many downward switches = bandwidth not being estimated correctly.</p>
                    <p>• Decoder slots max = 3. If all 3 filled with preloads, active video may be evicted.</p>
                    <p>• Blob cache ready = segments prefetched and available for instant promotion.</p>
                    <p>• Export JSON to share with engineering for offline analysis.</p>
                  </div>
                </Section>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #1e293b', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ background: '#0f172a', padding: '4px 10px', color: '#38bdf8', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ padding: '8px 10px' }}>
        {children}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px 16px' }}>
      {children}
    </div>
  );
}

function KV({ k, v, highlight }: { k: string; v: string; highlight?: 'good' | 'warn' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #0f172a' }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{
        color: highlight === 'good' ? '#4ade80' : highlight === 'warn' ? '#f87171' : '#e2e8f0',
        fontWeight: highlight ? 700 : 400,
      }}>{v}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '4px 8px 4px 0', fontSize: 10, fontWeight: 600 }}>{children}</th>;
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '4px 8px 4px 0', ...style }}>{children}</td>;
}

function EmptyState({ message }: { message: string }) {
  return <p style={{ color: '#475569', padding: '16px 0', textAlign: 'center' }}>{message}</p>;
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 3,
    padding: '3px 8px', fontSize: 10, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
  };
}
