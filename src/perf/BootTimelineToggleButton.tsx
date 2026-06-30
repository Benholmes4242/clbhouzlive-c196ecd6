// Pre-launch visible debug toggle for boot-timeline events. Mounted app-wide
// in App.tsx beside <PerfToggleButton/>. localStorage flip + reload — boot
// events only matter from the next cold boot anyway.
import React, { useState, useEffect } from 'react';
import { enableBootTimeline, disableBootTimeline } from '@/utils/bootTimeline';

const isBootOn = () =>
  typeof window !== 'undefined' &&
  window.localStorage?.getItem('BOOT_TIMELINE') === 'true';

export function BootTimelineToggleButton() {
  const [on, setOn] = useState(isBootOn());
  useEffect(() => setOn(isBootOn()), []);
  return (
    <button
      type="button"
      onClick={() => {
        if (on) {
          disableBootTimeline();
        } else {
          enableBootTimeline();
        }
        // Reload so the next boot captures from the very first event.
        setTimeout(() => window.location.reload(), 50);
      }}
      aria-label="Toggle boot timeline"
      style={{
        position: 'fixed',
        bottom: 80,
        left: 64,
        zIndex: 100000,
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
        background: on ? 'rgba(251,191,36,0.18)' : 'rgba(0,0,0,0.7)',
        color: on ? '#fbbf24' : '#9ca3af',
        border: '1px solid rgba(251,191,36,0.35)',
        borderRadius: 6,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {on ? 'BOOT ON' : 'BOOT'}
    </button>
  );
}

export default BootTimelineToggleButton;
