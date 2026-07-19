/**
 * Fsv2DebugHUD — floating collapsible panel that renders the fsv2 event
 * ring buffer + latest inspector sample. Zero-cost when the fsv2Debug
 * flag is off: the component still mounts (so the toggle works live) but
 * the panel returns null and no listeners are attached.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  isFsv2DebugEnabled,
  setFsv2DebugEnabled,
  subscribe,
  getEntries,
  getLatestSample,
  clearBuffer,
  copyToClipboard,
  type HudEntry,
} from './hudBus';

export const Fsv2DebugHUD: React.FC = () => {
  const [, force] = useState(0);
  const [enabled, setEnabled] = useState(isFsv2DebugEnabled());
  const [collapsed, setCollapsed] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const un = subscribe(() => {
      setEnabled(isFsv2DebugEnabled());
      force((n) => n + 1);
    });
    return un;
  }, []);

  // Auto-scroll to bottom on new events.
  useEffect(() => {
    if (!enabled || collapsed) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  if (!enabled) return null;

  const entries = getEntries();
  const sample = getLatestSample();
  const summary = summarize(sample);

  const onCopy = async () => {
    try {
      await copyToClipboard();
      setCopyMsg('Copied!');
    } catch {
      setCopyMsg('Copy failed');
    }
    setTimeout(() => setCopyMsg(null), 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        width: collapsed ? 120 : 380,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: collapsed ? 32 : 'calc(100vh - 40px)',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: 10,
        lineHeight: 1.3,
        color: '#e5e7eb',
        background: 'rgba(0,0,0,0.88)',
        border: '1px solid #22d3ee',
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          padding: '4px 6px',
          background: 'rgba(34,211,238,0.15)',
          borderBottom: collapsed ? 'none' : '1px solid rgba(34,211,238,0.35)',
        }}
      >
        <strong style={{ color: '#22d3ee' }}>FSV2 HUD</strong>
        <span style={{ opacity: 0.5 }}>{entries.length}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={btn}
        >{collapsed ? '▼' : '▲'}</button>
        {!collapsed ? (
          <>
            <button onClick={onCopy} style={btn}>{copyMsg ?? 'Copy'}</button>
            <button onClick={() => { clearBuffer(); }} style={btn}>Clr</button>
            <button
              onClick={() => setFsv2DebugEnabled(false)}
              style={{ ...btn, color: '#f87171' }}
            >Off</button>
          </>
        ) : null}
      </div>

      {!collapsed ? (
        <>
          <div
            style={{
              padding: '4px 6px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {summary}
          </div>
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 6px',
            }}
          >
            {entries.slice(-120).map((e, i) => (
              <div
                key={i}
                style={{
                  padding: '2px 0',
                  borderBottom: '1px dashed rgba(255,255,255,0.06)',
                  color: colorFor(e.name),
                }}
              >
                <span style={{ opacity: 0.55 }}>{String(e.t).padStart(5, ' ')}ms </span>
                <strong>{e.name}</strong>{' '}
                <span style={{ opacity: 0.7 }}>{shortPayload(e)}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

const btn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#e5e7eb',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 3,
  padding: '2px 6px',
  fontSize: 10,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

function colorFor(name: string): string {
  if (name.startsWith('el.err') || name.includes('fail')) return '#fca5a5';
  if (name.startsWith('reveal')) return '#86efac';
  if (name === 'tap' || name === 'open') return '#fcd34d';
  if (name === 'sample') return '#94a3b8';
  return '#e5e7eb';
}

function shortPayload(e: HudEntry): string {
  if (e.name === 'sample') {
    const s = e.payload as {
      video?: { connected?: boolean; rect?: { w: number; h: number }; readyState?: number; frameDelta?: number; ioRatio?: number };
      hit?: { tag?: string; isVideo?: boolean; z?: string };
    };
    const v = s.video;
    const h = s.hit;
    return [
      v ? `V ${v.connected ? '✓' : '✗'} ${v.rect?.w}×${v.rect?.h} rs=${v.readyState} Δf=${v.frameDelta ?? '?'} io=${v.ioRatio}` : '',
      h ? `hit=${h.tag}${h.isVideo ? '✓' : '✗'} z=${h.z}` : '',
    ].filter(Boolean).join(' | ');
  }
  const p = e.payload as Record<string, unknown>;
  const parts: string[] = [];
  for (const k of Object.keys(p)) {
    if (k === 'openId') continue;
    const v = p[k];
    if (v == null) continue;
    if (typeof v === 'object') continue;
    parts.push(`${k}=${String(v).slice(0, 30)}`);
  }
  return parts.join(' ');
}

function summarize(sample: HudEntry | null): string {
  if (!sample) return 'no sample yet';
  const s = sample.payload as {
    video?: {
      connected?: boolean;
      rect?: { w: number; h: number };
      readyState?: number;
      videoW?: number;
      videoH?: number;
      frames?: number;
      frameDelta?: number;
      ioRatio?: number;
      chain?: Array<{ op: string; disp: string; vis: string }>;
    };
    hit?: { tag?: string; isVideo?: boolean };
    mediaCensus?: { videoEls?: number; withSrcCount?: number };
  };
  const v = s.video;
  if (!v) return 'no video registered';
  const chain = v.chain ?? [];
  const opChain = chain.map((c) => c.op).join('→');
  const badAncestor = chain.find((c) => c.op !== '' && parseFloat(c.op) < 1)
    || chain.find((c) => c.disp === 'none' || c.vis === 'hidden');
  const hitTag = s.hit?.tag ?? '?';
  const hitVideo = s.hit?.isVideo ? '✓VIDEO' : `⚠ ${hitTag}`;
  const census = s.mediaCensus;
  const censusStr = census
    ? `CENSUS ${census.withSrcCount}/${census.videoEls}`
    : '';
  return [
    `CONN ${v.connected ? '✓' : '✗'}`,
    `RECT ${v.rect?.w}×${v.rect?.h}`,
    `INTRINSIC ${v.videoW}×${v.videoH}`,
    `RS ${v.readyState}`,
    `FRAMES ${v.frames ?? '?'}`,
    `Δframes ${v.frameDelta ?? '?'}`,
    `IO ${v.ioRatio}`,
    `HIT ${hitVideo}`,
    censusStr,
    `OPCHAIN ${opChain}`,
    badAncestor ? `⚠ ANCESTOR op=${badAncestor.op} disp=${badAncestor.disp} vis=${badAncestor.vis}` : '',
  ].filter(Boolean).join('  ');
}


export default Fsv2DebugHUD;
