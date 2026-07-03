/**
 * /dev/video-engine — THROWAWAY Stage 0 verification route.
 *
 * DELETE after Stage 1 wires feed<->fullscreen onto the trusted engine.
 * Proves on device:
 *  (1) loadSource re-point plays without recreating the element
 *  (2) two lanes play independently
 *  (3) startPosition seeks to the right frame on first paint (no 0-then-jump)
 *  (4) release + reload reuses the lane cleanly
 *  (5) one-unmuted-lane enforced
 *  (6) visibility pause
 *
 * No feed/fullscreen/watch wiring — just the engine + hosts + buttons.
 */

import { useEffect, useMemo, useState } from 'react';
import { VideoEngine, type LaneId } from '@/video/VideoEngine';
import { useVideoLane } from '@/video/useVideoLane';
import { buildHlsUrl } from '@/utils/streamId';
import { getThumbnailUrl } from '@/utils/thumbnail';

// Two known-good public HLS test streams (Cloudflare/Mux/Bitmovin).
// Callers can paste their own Cloudflare Stream UIDs to test against real assets.
const SAMPLE_A = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const SAMPLE_B = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

function LaneCard({
  laneId,
  hlsUrl,
  posterUrl,
  startPosition,
  active,
  muted,
  onToggleActive,
  onToggleMute,
}: {
  laneId: LaneId;
  hlsUrl: string | null;
  posterUrl?: string | null;
  startPosition?: number;
  active: boolean;
  muted: boolean;
  onToggleActive: () => void;
  onToggleMute: () => void;
}) {
  const lane = useVideoLane(laneId, { hlsUrl, posterUrl, startPosition, active, muted });
  return (
    <div style={{ border: '1px solid #333', borderRadius: 8, padding: 8, background: '#0d0d0d' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: 12, marginBottom: 6 }}>
        <strong style={{ color: '#F7931E' }}>{laneId}</strong>
        <span>
          {lane.snapshot.state} · rs={lane.snapshot.readyState} · t=
          {lane.snapshot.currentTime.toFixed(2)} · ff={String(lane.snapshot.firstFrame)} · muted=
          {String(lane.snapshot.muted)}
        </span>
      </div>
      <div
        ref={lane.hostRef}
        style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: 6, overflow: 'hidden' }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={onToggleActive}>{active ? 'Pause' : 'Play'}</button>
        <button onClick={() => lane.seek(10)}>Seek 10s</button>
        <button onClick={() => lane.seek(30)}>Seek 30s</button>
        <button onClick={onToggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
        <button onClick={lane.release}>Release</button>
      </div>
    </div>
  );
}

export default function VideoEngineTestPage() {
  const [uidInput, setUidInput] = useState('');
  const [srcA, setSrcA] = useState<string | null>(SAMPLE_A);
  const [srcB, setSrcB] = useState<string | null>(SAMPLE_B);
  const [posterA, setPosterA] = useState<string | null>(null);
  const [startA, setStartA] = useState<number>(-1);
  const [activeA, setActiveA] = useState(false);
  const [activeB, setActiveB] = useState(false);
  const [mutedA, setMutedA] = useState(true);
  const [mutedB, setMutedB] = useState(true);

  useEffect(() => {
    (window as any).__VIDEO_ENGINE_DBG__ = true;
    VideoEngine.boot();
    return () => {
      // Do NOT tear down — lanes persist for reuse. This route is throwaway.
    };
  }, []);

  const loadFromUid = () => {
    const url = buildHlsUrl(uidInput.trim());
    if (!url) return;
    const poster = getThumbnailUrl({ streamId: uidInput.trim(), size: 'large' });
    setSrcA(url);
    setPosterA(poster);
  };

  const simulateHandoff = () => {
    // Read lane-A's current time, load same source into lane-B at that time.
    const t = VideoEngine.getTime('feed-active');
    if (!srcA) return;
    setStartA(-1); // no-op change
    setSrcB(srcA);
    // Wait a tick for React to apply; then seek B via engine directly.
    requestAnimationFrame(() => {
      VideoEngine.load('feed-next', { hlsUrl: srcA, startPosition: Math.max(0, t) });
      setActiveA(false);
      setActiveB(true);
    });
  };

  const lanes = useMemo(() => VideoEngine.listLanes(), []);

  return (
    <div style={{ padding: 16, background: '#0a0a0a', color: '#eee', minHeight: '100vh', fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>VideoEngine — Stage 0 dev route</h1>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        Registered lanes: {lanes.join(', ')} · Rule: one &lt;video&gt; = one hls = one owner. Re-point via loadSource.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={uidInput}
          onChange={(e) => setUidInput(e.target.value)}
          placeholder="Cloudflare UID or URL"
          style={{ flex: 1, minWidth: 240, padding: 6, background: '#111', color: '#eee', border: '1px solid #333', borderRadius: 4 }}
        />
        <button onClick={loadFromUid}>Load UID into A</button>
        <button onClick={() => { setSrcA(SAMPLE_A); setPosterA(null); setStartA(-1); }}>Load Sample A</button>
        <button onClick={() => { setSrcA(SAMPLE_B); setPosterA(null); setStartA(-1); }}>Re-point A → Sample B</button>
        <button onClick={() => { setSrcA(SAMPLE_A); setStartA(25); }}>Load A with startPosition=25</button>
        <button onClick={simulateHandoff}>Simulate handoff A→B at currentTime</button>
        <button onClick={() => VideoEngine.pauseAll()}>Pause All</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 12 }}>
        <LaneCard
          laneId="feed-active"
          hlsUrl={srcA}
          posterUrl={posterA}
          startPosition={startA}
          active={activeA}
          muted={mutedA}
          onToggleActive={() => setActiveA((v) => !v)}
          onToggleMute={() => setMutedA((v) => !v)}
        />
        <LaneCard
          laneId="feed-next"
          hlsUrl={srcB}
          active={activeB}
          muted={mutedB}
          onToggleActive={() => setActiveB((v) => !v)}
          onToggleMute={() => setMutedB((v) => !v)}
        />
      </div>

      <p style={{ fontSize: 11, color: '#666', marginTop: 16 }}>
        THROWAWAY: delete this file, its route, and any imports after Stage 1.
      </p>
    </div>
  );
}
