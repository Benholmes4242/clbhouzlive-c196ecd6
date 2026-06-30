// Pre-launch visible debug toggle. Mounted on /auth only. REMOVE before public release.
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
      style={{
        marginTop: 16,
        width: '100%',
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'monospace',
        background: on ? 'rgba(103,232,249,0.15)' : 'rgba(255,255,255,0.04)',
        color: on ? '#67e8f9' : '#9ca3af',
        border: '1px solid rgba(103,232,249,0.3)',
        borderRadius: 8,
      }}
    >
      {on ? 'Debug logging ON — tap to disable' : 'Enable debug logging'}
    </button>
  );
}

export default PerfToggleButton;
