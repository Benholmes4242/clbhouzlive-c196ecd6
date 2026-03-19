/**
 * FeedVideoDebugOverlay — World-class video diagnostics panel
 * 
 * Reads from:
 * - mediaStore (live HTMLVideoElement — confirmed accurate)
 * - mobileVideoDebug subscriber (HLS events — LEVEL_SWITCHED, FRAG_LOADED, errors)
 * - Direct HTMLVideoElement polling (readyState, networkState, buffered, dimensions)
 * 
 * 5 tabs: LIVE · QUALITY · BUFFER · EVENTS · SESSION
 * 
 * Floating button shows current quality (HD/720/480/etc) colour-coded green/amber/red.
 * Auto-enables MOBILE_VIDEO_DEBUG in localStorage when panel is opened.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMediaStoreCompat } from '@/components/media-system/store/useMediaStoreCompat';
import { subscribeToDebugLogs, clearDebugLogs, type DebugLogEntry } from '@/media/mobileVideoDebug';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoSnapshot {
  readyState: number;
  networkState: number;
  paused: boolean;
  currentTime: number;
  duration: number;
  videoWidth: number;
  videoHeight: number;
  bufferedEnd: number;
  bufferedPct: number;
  src: string;
  error: string | null;
  playbackRate: number;
}

interface SessionStat {
  index: number;
  ttff: number | null;
  qualityHistory: number[];
  currentQuality: number;
  stallCount: number;
  totalStallMs: number;
  errorCount: number;
  prefetched: boolean;
  startedAt: number;
}

type Tab = 'live' | 'quality' | 'buffer' | 'events' | 'session';

const READY_LABELS = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT', 'HAVE_FUTURE', 'HAVE_ENOUGH'];
const NETWORK_LABELS = ['EMPTY', 'IDLE', 'LOADING', 'NO_SOURCE'];

// ─── Colour helpers ───────────────────────────────────────────────────────────

function qualityColor(h: number): string {
  if (h >= 1080) return '#34D399';
  if (h >= 720)  return '#60A5FA';
  if (h >= 480)  return '#FBBF24';
  if (h > 0)     return '#F87171';
  return '#6B7280';
}

function qualityLabel(h: number): string {
  if (h >= 2160) return '4K';
  if (h >= 1440) return '1440p';
  if (h >= 1080) return '1080p';
  if (h >= 720)  return '720p';
  if (h >= 480)  return '480p';
  if (h >= 360)  return '360p';
  if (h > 0)     return `${h}p`;
  return '—';
}

function ttffColor(ms: number | null): string {
  if (ms === null)  return '#6B7280';
  if (ms < 500)     return '#34D399';
  if (ms < 1500)    return '#FBBF24';
  return '#F87171';
}

function bufferColor(pct: number): string {
  if (pct > 0.5)  return '#34D399';
  if (pct > 0.2)  return '#FBBF24';
  return '#F87171';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeedVideoDebugOverlay() {
  const [isOpen, setIsOpen]         = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>('live');
  const [copyState, setCopyState]   = useState<'idle' | 'copied' | 'failed'>('idle');
  const activeVideoElement          = useMediaStore(s => s.activeVideoElement);
  const activeIndex                 = useMediaStore(s => s.activeIndex);
  const isMuted                     = useMediaStore(s => s.isMuted);
  const errorItems                  = useMediaStore(s => s.errorItems);

  const [snap, setSnap]             = useState<VideoSnapshot | null>(null);
  const [domVideoCount, setDomVideoCount] = useState(0);
  const [logs, setLogs]             = useState<DebugLogEntry[]>([]);
  const [sessions, setSessions]     = useState<SessionStat[]>([]);

  const playStartRef     = useRef<number | null>(null);
  const firstFrameRef    = useRef(false);
  const stallStartRef    = useRef<number | null>(null);
  const currentIdxRef    = useRef(-1);
  const copyTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enable MOBILE_VIDEO_DEBUG in localStorage when panel opens
  const handleOpen = useCallback(() => {
    try { localStorage.setItem('clbhouz-video-debug', 'true'); } catch {}
    setIsOpen(true);
  }, []);

  // Subscribe to HLS event log
  useEffect(() => {
    const unsub = subscribeToDebugLogs(newLogs => {
      setLogs([...newLogs].reverse());
    });
    return unsub;
  }, []);

  // Poll live video element at 4Hz
  useEffect(() => {
    if (!isOpen) return;
    const tick = () => {
      setDomVideoCount(document.querySelectorAll('video').length);
      const el = activeVideoElement;
      if (!el) { setSnap(null); return; }
      const bufferedEnd = el.buffered.length > 0 ? el.buffered.end(el.buffered.length - 1) : 0;
      const dur = el.duration || 0;
      setSnap({
        readyState:   el.readyState,
        networkState: el.networkState,
        paused:       el.paused,
        currentTime:  Math.round(el.currentTime * 10) / 10,
        duration:     Math.round(dur * 10) / 10,
        videoWidth:   el.videoWidth,
        videoHeight:  el.videoHeight,
        bufferedEnd:  Math.round(bufferedEnd * 10) / 10,
        bufferedPct:  dur > 0 ? bufferedEnd / dur : 0,
        src:          (el.src || el.currentSrc || '').slice(-50),
        error:        el.error ? `Code ${el.error.code}` : null,
        playbackRate: el.playbackRate,
      });

      // TTFF — first non-zero currentTime after video change
      if (el.currentTime > 0 && !firstFrameRef.current && playStartRef.current) {
        firstFrameRef.current = true;
        const ttff = Math.round(performance.now() - playStartRef.current);
        setSessions(prev => {
          if (!prev.length) return prev;
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], ttff };
          return next;
        });
      }

      // Stall detection — readyState < 3 while not paused
      if (el.readyState < 3 && !el.paused) {
        if (!stallStartRef.current) stallStartRef.current = performance.now();
      } else if (stallStartRef.current) {
        const stallMs = Math.round(performance.now() - stallStartRef.current);
        stallStartRef.current = null;
        setSessions(prev => {
          if (!prev.length) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, stallCount: last.stallCount + 1, totalStallMs: last.totalStallMs + stallMs };
          return next;
        });
      }
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isOpen, activeVideoElement]);

  // New session on video change
  useEffect(() => {
    if (activeIndex === currentIdxRef.current) return;
    currentIdxRef.current = activeIndex;
    playStartRef.current  = performance.now();
    firstFrameRef.current = false;
    stallStartRef.current = null;
    setSessions(prev => {
      const next = [...prev, {
        index:        activeIndex,
        ttff:         null,
        qualityHistory: [],
        currentQuality: 0,
        stallCount:   0,
        totalStallMs: 0,
        errorCount:   0,
        prefetched:   false,
        startedAt:    Date.now(),
      }];
      return next.slice(-15); // keep last 15
    });
  }, [activeIndex]);

  // Parse HLS events into session quality history
  useEffect(() => {
    if (!logs.length) return;
    const latest = logs[0]; // newest first
    if (!latest) return;
    if (latest.message.includes('LEVEL_SWITCHED') && latest.data?.height) {
      const h = latest.data.height as number;
      setSessions(prev => {
        if (!prev.length) return prev;
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        if (!last.qualityHistory.includes(h)) {
          last.qualityHistory = [...last.qualityHistory, h];
        }
        last.currentQuality = h;
        next[next.length - 1] = last;
        return next;
      });
    }
    if (latest.message.toLowerCase().includes('prefetch')) {
      setSessions(prev => {
        if (!prev.length) return prev;
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], prefetched: true };
        return next;
      });
    }
    if (latest.level === 'error') {
      setSessions(prev => {
        if (!prev.length) return prev;
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, errorCount: last.errorCount + 1 };
        return next;
      });
    }
  }, [logs]);

  const currentSession = sessions[sessions.length - 1] ?? null;
  const displayQuality = snap?.videoHeight || currentSession?.currentQuality || 0;

  // ─── Build full text report ──────────────────────────────────────────────
  const buildReport = useCallback((): string => {
    const cs = currentSession;
    const withTTFF = sessions.filter(s => s.ttff != null);
    const avgTTFF = withTTFF.length > 0 ? Math.round(withTTFF.reduce((a, s) => a + s.ttff!, 0) / withTTFF.length) : null;
    const sortedTTFF = [...withTTFF].sort((a, b) => a.ttff! - b.ttff!);
    const p95TTFF = sortedTTFF[Math.floor(sortedTTFF.length * 0.95)]?.ttff ?? null;
    const prefetchPct = sessions.length > 0 ? Math.round((sessions.filter(s => s.prefetched).length / sessions.length) * 100) : 0;
    const totalStalls = sessions.reduce((a, s) => a + s.stallCount, 0);
    const qualities = sessions.filter(s => s.currentQuality > 0).map(s => s.currentQuality).sort((a, b) => b - a);
    const medianQ = qualities[Math.floor(qualities.length / 2)] ?? 0;

    const lines: string[] = [
      'CLBHOUZ VIDEO DIAGNOSTICS REPORT',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Feed index: ${activeIndex}`,
      '',
      '=== LIVE ===',
      `Ready state: ${snap ? (READY_LABELS[snap.readyState] || snap.readyState) : 'NO ELEMENT'}`,
      `Network state: ${snap ? (NETWORK_LABELS[snap.networkState] || snap.networkState) : 'NO ELEMENT'}`,
      `Playing: ${snap ? (snap.paused ? 'NO' : 'YES') : 'NO ELEMENT'}`,
      `Position: ${snap ? `${snap.currentTime}s / ${snap.duration}s` : '—'}`,
      `Dimensions: ${snap?.videoWidth ? `${snap.videoWidth}×${snap.videoHeight}` : '—'}`,
      `Quality: ${qualityLabel(displayQuality)}`,
      `Buffer ahead: ${snap ? `${snap.bufferedEnd}s` : '—'}`,
      `Buffer %: ${snap ? `${Math.round(snap.bufferedPct * 100)}%` : '—'}`,
      `Muted: ${isMuted ? 'YES' : 'NO'}`,
      `DOM videos: ${domVideoCount}`,
      `Feed errors: ${errorItems.size}`,
      '',
      `=== QUALITY — VIDEO #${activeIndex} ===`,
      `Current quality: ${qualityLabel(displayQuality)}`,
      `TTFF: ${cs?.ttff != null ? `${cs.ttff}ms` : '—'}`,
      `Prefetched: ${cs?.prefetched ? 'YES' : 'NO (cold start)'}`,
      `ABR switches: ${cs?.qualityHistory.length ?? 0}`,
      `Stalls: ${cs?.stallCount ?? 0}`,
      `Quality ladder: [${(cs?.qualityHistory ?? []).map(h => qualityLabel(h)).join(', ')}]`,
      '',
      'Previous videos:',
      ...sessions.slice().reverse().slice(0, 14).map(s =>
        `  #${s.index}  ${qualityLabel(s.currentQuality)}  ${s.ttff != null ? `${s.ttff}ms` : '—'}  ${s.stallCount}×stall  ${s.prefetched ? '⚡' : '❄️'}`
      ),
      '',
      '=== BUFFER ===',
      `Buffer ahead: ${snap ? `${snap.bufferedEnd}s` : '—'}`,
      `Buffer %: ${snap ? `${Math.round(snap.bufferedPct * 100)}%` : '—'}`,
      `Duration: ${snap ? `${snap.duration}s` : '—'}`,
      `Position: ${snap ? `${snap.currentTime}s` : '—'}`,
      `Stalls: ${cs?.stallCount ?? 0}`,
      '',
      '=== EVENTS (last 80) ===',
      ...logs.slice(0, 80).map(l => `[${l.formattedTime?.slice(-12) || '—'}] [${l.category}] ${l.message}`),
      '',
      '=== SESSION SUMMARY ===',
      `Videos sampled: ${sessions.length}`,
      `Avg TTFF: ${avgTTFF != null ? `${avgTTFF}ms` : '—'}`,
      `P95 TTFF: ${p95TTFF != null ? `${p95TTFF}ms` : '—'}`,
      `Prefetch hit rate: ${prefetchPct}%`,
      `Total stalls: ${totalStalls}`,
      `Median quality: ${qualityLabel(medianQ)}`,
      '',
      'TTFF distribution:',
      `  < 500ms (excellent): ${withTTFF.filter(s => s.ttff! < 500).length} / ${withTTFF.length}`,
      `  500ms–1.5s (ok): ${withTTFF.filter(s => s.ttff! >= 500 && s.ttff! < 1500).length} / ${withTTFF.length}`,
      `  > 1.5s (needs fix): ${withTTFF.filter(s => s.ttff! >= 1500).length} / ${withTTFF.length}`,
    ];

    return lines.join('\n');
  }, [snap, currentSession, sessions, logs, activeIndex, isMuted, domVideoCount, errorItems, displayQuality]);

  const handleCopyReport = useCallback(async () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(buildReport());
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    copyTimerRef.current = setTimeout(() => setCopyState('idle'), 2000);
  }, [buildReport]);

  // ─── Colour palette ──────────────────────────────────────────────────────
  const C = {
    bg:      '#09090F',
    surface: '#12121C',
    border:  'rgba(255,255,255,0.07)',
    text:    '#E2E8F0',
    muted:   '#555F6E',
    accent:  '#60A5FA',
  };

  // ─── Floating button (closed) ────────────────────────────────────────────
  if (!isOpen) {
    const btnColor = displayQuality >= 1080 ? '#34D399'
                   : displayQuality >= 720  ? '#60A5FA'
                   : displayQuality > 0     ? '#FBBF24'
                   : 'rgba(255,255,255,0.15)';
    return (
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed', bottom: 110, right: 14, zIndex: 99999,
          width: 42, height: 42, borderRadius: 21,
          background: 'rgba(0,0,0,0.82)',
          border: `1.5px solid ${btnColor}`,
          color: btnColor, fontSize: 10, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', letterSpacing: 0.3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.40)',
        }}
      >
        {displayQuality >= 1080 ? 'HD'
         : displayQuality >= 720 ? '720'
         : displayQuality > 0   ? `${displayQuality}`
         : 'VID'}
      </button>
    );
  }

  // ─── Shared sub-components ────────────────────────────────────────────────
  const Row = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{label}</span>
      <span style={{ fontSize: 11, color: color || C.text, fontFamily: 'monospace', fontWeight: 600 }}>{value}</span>
    </div>
  );

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      onClick={() => setActiveTab(t)}
      style={{
        padding: '5px 9px', fontSize: 10, fontWeight: 700,
        letterSpacing: 0.7, textTransform: 'uppercase',
        cursor: 'pointer', border: 'none', borderRadius: 4,
        background: activeTab === t ? C.accent : 'transparent',
        color: activeTab === t ? '#000' : C.muted,
        fontFamily: 'monospace',
      }}
    >
      {label}
    </button>
  );

  // ─── Panel ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      style={{
        position: 'fixed', bottom: 90, left: 8, right: 8, zIndex: 99999,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        maxHeight: '68vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.65)',
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px 7px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, background: snap && !snap.paused ? '#34D399' : '#6B7280' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 0.8 }}>CLBHOUZ VIDEO DIAGNOSTICS</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: C.muted }}>DOM:{domVideoCount}</span>
          <button onClick={handleCopyReport} style={{ fontSize: 9, color: copyState === 'copied' ? '#34D399' : copyState === 'failed' ? '#F87171' : C.muted, background: 'none', border: `1px solid ${copyState === 'copied' ? '#34D39955' : copyState === 'failed' ? '#F8717155' : C.border}`, borderRadius: 3, padding: '2px 5px', cursor: 'pointer', minWidth: 56, textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', transition: 'color 0.2s, border-color 0.2s' }}>{copyState === 'copied' ? 'COPIED ✓' : copyState === 'failed' ? 'FAILED ✗' : 'COPY'}</button>
          <button onClick={() => clearDebugLogs()} style={{ fontSize: 9, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 5px', cursor: 'pointer' }}>CLR</button>
          <button onClick={() => setIsOpen(false)} style={{ fontSize: 16, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
        </div>
      </div>

      {/* ── Hero metrics bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '8px 14px', background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0, flexWrap: 'wrap', rowGap: 6 }}>
        {[
          { label: 'QUALITY',  value: qualityLabel(displayQuality), color: qualityColor(displayQuality) },
          { label: 'TTFF',     value: currentSession?.ttff != null ? `${currentSession.ttff}ms` : '—', color: ttffColor(currentSession?.ttff ?? null) },
          { label: 'STATUS',   value: snap ? (snap.paused ? 'PAUSED' : 'PLAYING') : 'NO EL', color: snap && !snap.paused ? '#34D399' : '#F87171' },
          { label: 'STALLS',   value: String(currentSession?.stallCount ?? 0), color: (currentSession?.stallCount ?? 0) > 0 ? '#F87171' : '#34D399' },
          { label: 'PREFETCH', value: currentSession?.prefetched ? '⚡ YES' : '❄️ NO', color: currentSession?.prefetched ? '#34D399' : '#FBBF24' },
          { label: 'FEED',     value: `#${activeIndex}`, color: C.muted },
        ].map((m, i) => (
          <div key={m.label} style={{ textAlign: 'center', flex: '1 0 16%', borderRight: i < 5 ? `1px solid ${C.border}` : 'none', padding: '0 6px' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 0.5, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* ── Buffer progress bar ── */}
      {snap && snap.duration > 0 && (
        <div style={{ padding: '5px 14px 4px', background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: C.muted }}>BUFFER</span>
            <span style={{ fontSize: 9, color: bufferColor(snap.bufferedPct) }}>{Math.round(snap.bufferedPct * 100)}% · {snap.bufferedEnd}s ahead · {snap.currentTime}s/{snap.duration}s</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${snap.bufferedPct * 100}%`, background: bufferColor(snap.bufferedPct), borderRadius: 3, transition: 'width 0.3s' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(snap.currentTime / snap.duration) * 100}%`, width: 2, background: '#60A5FA' }} />
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, padding: '5px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {tabBtn('live',    'Live')}
        {tabBtn('quality', 'Quality')}
        {tabBtn('buffer',  'Buffer')}
        {tabBtn('events',  'Events')}
        {tabBtn('session', 'Session')}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', WebkitOverflowScrolling: 'touch' }}>

        {/* LIVE */}
        {activeTab === 'live' && (
          <div>
            {!snap
              ? <div style={{ color: C.muted, fontSize: 11, padding: '12px 0' }}>No active video element. Scroll to a video.</div>
              : <>
                  <Row label="Ready state"   value={READY_LABELS[snap.readyState]   || snap.readyState}   color={snap.readyState >= 4 ? '#34D399' : snap.readyState >= 2 ? '#FBBF24' : '#F87171'} />
                  <Row label="Network state" value={NETWORK_LABELS[snap.networkState] || snap.networkState} color={snap.networkState === 1 ? '#34D399' : snap.networkState === 2 ? '#FBBF24' : '#F87171'} />
                  <Row label="Playing"       value={snap.paused ? 'NO ✗' : 'YES ✓'} color={snap.paused ? '#F87171' : '#34D399'} />
                  <Row label="Position"      value={`${snap.currentTime}s / ${snap.duration}s`} />
                  <Row label="Dimensions"    value={snap.videoWidth > 0 ? `${snap.videoWidth}×${snap.videoHeight}` : 'not decoded'} color={qualityColor(snap.videoHeight)} />
                  <Row label="Quality"       value={qualityLabel(snap.videoHeight)} color={qualityColor(snap.videoHeight)} />
                  <Row label="Buffer ahead"  value={`${snap.bufferedEnd}s`} color={bufferColor(snap.bufferedPct)} />
                  <Row label="Buffer %"      value={`${Math.round(snap.bufferedPct * 100)}%`} color={bufferColor(snap.bufferedPct)} />
                  <Row label="Playback rate" value={`${snap.playbackRate}×`} />
                  <Row label="Muted"         value={isMuted ? 'YES' : 'NO'} />
                  <Row label="DOM videos"    value={domVideoCount} />
                  <Row label="Feed errors"   value={errorItems.size} color={errorItems.size > 0 ? '#F87171' : '#34D399'} />
                  {snap.error && <Row label="Video error" value={snap.error} color="#F87171" />}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>SOURCE</div>
                    <div style={{ fontSize: 10, color: C.accent, wordBreak: 'break-all', lineHeight: 1.5 }}>…{snap.src}</div>
                  </div>
                </>
            }
          </div>
        )}

        {/* QUALITY */}
        {activeTab === 'quality' && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 8, letterSpacing: 0.8 }}>CURRENT VIDEO — FEED #{activeIndex}</div>
            <Row label="Current quality" value={qualityLabel(displayQuality)} color={qualityColor(displayQuality)} />
            <Row label="Raw dimensions"  value={snap?.videoWidth ? `${snap.videoWidth}×${snap.videoHeight}` : '—'} />
            <Row label="TTFF"            value={currentSession?.ttff != null ? `${currentSession.ttff}ms` : 'measuring…'} color={ttffColor(currentSession?.ttff ?? null)} />
            <Row label="Prefetched"      value={currentSession?.prefetched ? 'YES ⚡' : 'NO — cold start'} color={currentSession?.prefetched ? '#34D399' : '#FBBF24'} />
            <Row label="ABR switches"    value={currentSession?.qualityHistory.length ?? 0} />
            <Row label="Stalls"          value={currentSession?.stallCount ?? 0} color={(currentSession?.stallCount ?? 0) > 0 ? '#F87171' : '#34D399'} />
            <Row label="Stall time"      value={currentSession?.totalStallMs ? `${currentSession.totalStallMs}ms` : '0ms'} />
            {currentSession?.qualityHistory && currentSession.qualityHistory.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: 0.8 }}>QUALITY LADDER THIS VIDEO</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {currentSession.qualityHistory.map((h, i) => (
                    <div key={i} style={{ padding: '3px 8px', borderRadius: 4, background: qualityColor(h) + '22', border: `1px solid ${qualityColor(h)}55`, fontSize: 11, color: qualityColor(h), fontWeight: 700 }}>
                      {qualityLabel(h)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: 0.8 }}>PREVIOUS 14 VIDEOS</div>
              {sessions.slice().reverse().slice(0, 14).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.muted }}>#{s.index}</span>
                  <span style={{ fontSize: 10, color: qualityColor(s.currentQuality) }}>{qualityLabel(s.currentQuality)}</span>
                  <span style={{ fontSize: 10, color: ttffColor(s.ttff) }}>{s.ttff != null ? `${s.ttff}ms` : '—'}</span>
                  <span style={{ fontSize: 10, color: s.stallCount > 0 ? '#F87171' : '#34D399' }}>{s.stallCount}×stall</span>
                  <span style={{ fontSize: 10, color: s.prefetched ? '#34D399' : '#FBBF24' }}>{s.prefetched ? '⚡' : '❄️'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUFFER */}
        {activeTab === 'buffer' && (
          <div>
            {!snap
              ? <div style={{ color: C.muted, fontSize: 11 }}>No active video.</div>
              : <>
                  <Row label="Buffer ahead"  value={`${snap.bufferedEnd}s`}                   color={bufferColor(snap.bufferedPct)} />
                  <Row label="Buffer %"      value={`${Math.round(snap.bufferedPct * 100)}%`} color={bufferColor(snap.bufferedPct)} />
                  <Row label="Duration"      value={`${snap.duration}s`} />
                  <Row label="Position"      value={`${snap.currentTime}s`} />
                  <Row label="Remaining"     value={`${Math.max(0, Math.round((snap.duration - snap.currentTime) * 10) / 10)}s`} />
                  <Row label="Ready state"   value={READY_LABELS[snap.readyState] || snap.readyState} color={snap.readyState >= 3 ? '#34D399' : '#F87171'} />
                  <Row label="Network state" value={NETWORK_LABELS[snap.networkState] || snap.networkState} />
                  <Row label="Stalls"        value={currentSession?.stallCount ?? 0}               color={(currentSession?.stallCount ?? 0) > 0 ? '#F87171' : '#34D399'} />
                  <Row label="Total stall"   value={currentSession?.totalStallMs ? `${currentSession.totalStallMs}ms` : '0ms'} />
                  <div style={{ margin: '12px 0 4px' }}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 5 }}>BUFFER VISUALISER</div>
                    <div style={{ height: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${snap.bufferedPct * 100}%`, background: bufferColor(snap.bufferedPct) + '44', transition: 'width 0.25s' }} />
                      <div style={{ position: 'absolute', left: `${(snap.currentTime / snap.duration) * 100}%`, top: 0, bottom: 0, width: 2, background: '#60A5FA' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                        {Math.round(snap.bufferedPct * 100)}% buffered · {snap.bufferedEnd}s ahead
                      </div>
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>HLS EVENT STREAM — {logs.length} events (newest first)</div>
            {logs.length === 0
              ? <div style={{ color: C.muted, fontSize: 11 }}>No HLS events yet. Scroll videos to populate. Events require MOBILE_VIDEO_DEBUG=true in localStorage.</div>
              : logs.slice(0, 80).map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 6, padding: '3px 0', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <span style={{ fontSize: 9, color: C.muted, flexShrink: 0, minWidth: 55 }}>{log.formattedTime?.slice(-12) || '—'}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, flexShrink: 0, minWidth: 44,
                      color: log.level === 'error' ? '#F87171' : log.level === 'warning' ? '#FBBF24' : log.level === 'success' ? '#34D399' : '#60A5FA',
                    }}>{log.category}</span>
                    <span style={{ fontSize: 9, color: C.text, lineHeight: 1.45, wordBreak: 'break-all' }}>{log.message}</span>
                  </div>
                ))
            }
          </div>
        )}

        {/* SESSION */}
        {activeTab === 'session' && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 8, letterSpacing: 0.8 }}>AGGREGATE STATS — {sessions.length} VIDEOS THIS SESSION</div>
            {sessions.length === 0
              ? <div style={{ color: C.muted, fontSize: 11 }}>No session data yet. Scroll through videos.</div>
              : (() => {
                  const withTTFF   = sessions.filter(s => s.ttff != null);
                  const avgTTFF    = withTTFF.length > 0 ? Math.round(withTTFF.reduce((a, s) => a + s.ttff!, 0) / withTTFF.length) : null;
                  const sortedTTFF = [...withTTFF].sort((a, b) => a.ttff! - b.ttff!);
                  const p95TTFF    = sortedTTFF[Math.floor(sortedTTFF.length * 0.95)]?.ttff ?? null;
                  const prefetchPct = sessions.length > 0 ? Math.round((sessions.filter(s => s.prefetched).length / sessions.length) * 100) : 0;
                  const totalStalls = sessions.reduce((a, s) => a + s.stallCount, 0);
                  const qualities   = sessions.filter(s => s.currentQuality > 0).map(s => s.currentQuality).sort((a, b) => b - a);
                  const medianQ     = qualities[Math.floor(qualities.length / 2)] ?? 0;
                  return (
                    <>
                      <Row label="Videos sampled"     value={sessions.length} />
                      <Row label="Avg TTFF"           value={avgTTFF != null ? `${avgTTFF}ms` : '—'} color={ttffColor(avgTTFF)} />
                      <Row label="P95 TTFF"           value={p95TTFF != null ? `${p95TTFF}ms` : '—'} color={ttffColor(p95TTFF)} />
                      <Row label="Prefetch hit rate"  value={`${prefetchPct}%`}  color={prefetchPct > 70 ? '#34D399' : prefetchPct > 40 ? '#FBBF24' : '#F87171'} />
                      <Row label="Total stalls"       value={totalStalls}         color={totalStalls > 0 ? '#F87171' : '#34D399'} />
                      <Row label="Median quality"     value={qualityLabel(medianQ)} color={qualityColor(medianQ)} />
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: 0.8 }}>TTFF DISTRIBUTION</div>
                        <Row label="< 500ms (excellent)"  value={`${withTTFF.filter(s => s.ttff! < 500).length} / ${withTTFF.length}`}  color="#34D399" />
                        <Row label="500ms–1.5s (ok)"      value={`${withTTFF.filter(s => s.ttff! >= 500 && s.ttff! < 1500).length} / ${withTTFF.length}`} color="#FBBF24" />
                        <Row label="> 1.5s (needs fix)"   value={`${withTTFF.filter(s => s.ttff! >= 1500).length} / ${withTTFF.length}`} color="#F87171" />
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: 0.8 }}>QUALITY DISTRIBUTION</div>
                        {[1080, 720, 480, 360, 0].map(threshold => {
                          const count = qualities.filter(q => threshold === 0 ? q < 360 : q >= threshold && (threshold === 1080 ? true : q < threshold * 2)).length;
                          if (count === 0) return null;
                          return <Row key={threshold} label={threshold === 0 ? '< 360p' : `${qualityLabel(threshold)}+`} value={`${count} / ${qualities.length}`} color={qualityColor(threshold || 240)} />;
                        })}
                      </div>
                    </>
                  );
                })()
            }
          </div>
        )}

      </div>
    </div>
  );
}

export default FeedVideoDebugOverlay;
