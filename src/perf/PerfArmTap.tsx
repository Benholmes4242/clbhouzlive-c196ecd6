// Invisible 5-tap target (top-left corner) to enable the perf/log HUDs on a device with no
// console. Always mounted; visually nothing; only acts on 5 quick taps. Safe in prod: it only
// writes a local flag the user could not discover by accident.
import React, { useRef } from 'react';
import { enablePerf, disablePerf, isPerfEnabled } from './navTiming';

export function PerfArmTap() {
  const taps = useRef<number[]>([]);
  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 1500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      if (isPerfEnabled()) disablePerf();
      else enablePerf();
    }
  };
  return (
    <button
      onClick={onTap}
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 44,
        height: 44,
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        opacity: 0,
        zIndex: 2147483647,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'default',
      }}
    />
  );
}

export default PerfArmTap;
