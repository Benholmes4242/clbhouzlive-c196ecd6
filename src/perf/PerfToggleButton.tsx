// Pre-launch visible debug toggle. Mounted via AdminGatedPerfPill wrapper.
// Long-press the pill (600ms) → emit the [BASELINE] scorecard.
// NOTE: gating (admin role + per-device toggle) lives in the wrapper — this
// component MUST keep all hook calls unconditional (Rules of Hooks).
import React, { useState, useEffect, useRef } from 'react';
import { isPerfEnabled, setPerfLive, subscribePerfLive } from '@/perf/navTiming';
import { vperfScorecard } from '@/perf/vperf';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useAdminPillVisibility } from '@/hooks/useAdminPillVisibility';

export function PerfToggleButton() {
  const [, force] = useState(0);
  useEffect(() => subscribePerfLive(() => force((n) => n + 1)), []);
  const on = isPerfEnabled();
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  const startLongPress = () => {
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      try { vperfScorecard('manual'); } catch {}
      try { (navigator as any).vibrate?.(20); } catch {}
    }, 600);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current != null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (longPressFired.current) { longPressFired.current = false; return; }
        setPerfLive(!on);
      }}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      aria-label="Toggle debug logging (long-press for scorecard)"
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
