import { useEffect, useState } from 'react';
import { useMediaStore } from '@/components/media-system/store/mediaStore';

const READY_STATE = ['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA'];
const NETWORK_STATE = ['EMPTY','IDLE','LOADING','NO_SOURCE'];

export function FeedVideoDebugOverlay() {
  const activeIndex = useMediaStore(s => s.activeIndex);
  const isMuted = useMediaStore(s => s.isMuted);
  const activeVideoElement = useMediaStore(s => s.activeVideoElement);
  const [isOpen, setIsOpen] = useState(false);
  const [videoStats, setVideoStats] = useState({
    readyState: 0,
    networkState: 0,
    paused: true,
    currentTime: 0,
    duration: 0,
    src: '',
    videoWidth: 0,
    videoHeight: 0,
    error: null as string | null,
  });
  const [domVideoCount, setDomVideoCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDomVideoCount(document.querySelectorAll('video').length);
      const el = activeVideoElement;
      if (!el) return;
      setVideoStats({
        readyState: el.readyState,
        networkState: el.networkState,
        paused: el.paused,
        currentTime: Math.round(el.currentTime * 10) / 10,
        duration: Math.round((el.duration || 0) * 10) / 10,
        src: el.src?.slice(-40) || el.currentSrc?.slice(-40) || 'none',
        videoWidth: el.videoWidth,
        videoHeight: el.videoHeight,
        error: el.error ? `${el.error.code}: ${el.error.message}` : null,
      });
    }, 500);
    return () => clearInterval(interval);
  }, [activeVideoElement, isOpen]);

  // Floating toggle button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 100, right: 12, zIndex: 99999,
          width: 36, height: 36, borderRadius: 18,
          background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#34D399', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        V
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', bottom: 80, left: 8, right: 8, zIndex: 99999,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '12px 14px',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.8)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: '#34D399', textTransform: 'uppercase' }}>
            Feed Video Debug
          </span>
          <button onClick={() => setIsOpen(false)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div>Active feed index: <span style={{ color: '#fff' }}>{activeIndex}</span></div>
        <div>DOM &lt;video&gt; count: <span style={{ color: domVideoCount > 0 ? '#34D399' : '#F87171', fontWeight: 700 }}>{domVideoCount}</span></div>
        <div>Active element: <span style={{ color: activeVideoElement ? '#34D399' : '#F87171', fontWeight: 700 }}>{activeVideoElement ? 'YES' : 'NONE'}</span></div>
        {activeVideoElement && (
          <>
            <div>Ready: {READY_STATE[videoStats.readyState] || videoStats.readyState}</div>
            <div>Network: {NETWORK_STATE[videoStats.networkState] || videoStats.networkState}</div>
            <div>Paused: {videoStats.paused ? 'YES' : 'NO'}</div>
            <div>Time: {videoStats.currentTime}s / {videoStats.duration}s</div>
            <div>Dims: {videoStats.videoWidth}×{videoStats.videoHeight}</div>
            <div>Muted: {isMuted ? 'YES' : 'NO'}</div>
            {videoStats.error && <div style={{ color: '#F87171' }}>ERROR: {videoStats.error}</div>}
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>src: …{videoStats.src}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedVideoDebugOverlay;
