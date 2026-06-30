// Pre-launch visible debug toggle. Mounted app-wide in App.tsx. REMOVE before public release.
import React, { useState, useEffect } from 'react';
import { isPerfEnabled, setPerfLive, subscribePerfLive } from '@/perf/navTiming';

export function PerfToggleButton() {
  const [, force] = useState(0);
  useEffect(() => subscribePerfLive(() => force((n) => n + 1)), []);
  const on = isPerfEnabled();
  return (
    <button
      type="button"
      onClick={() => setPerfLive(!on)}
      aria-label="Toggle debug logging"
      style={{
        position: 'fixed',
        bottom: 80,
        left: 8,
        zIndex: 100000,
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
        background: on ? 'rgba(103,232,249,0.18)' : 'rgba(0,0,0,0.7)',
        color: on ? '#67e8f9' : '#9ca3af',
        border: '1px solid rgba(103,232,249,0.35)',
        borderRadius: 6,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {on ? 'DBG ON' : 'DBG'}
    </button>
  );
}

export default PerfToggleButton;
