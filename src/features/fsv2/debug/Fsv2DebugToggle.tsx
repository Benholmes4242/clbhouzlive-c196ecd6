/**
 * Fsv2DebugToggle — floating pill (like PerfToggleButton) that flips the
 * on-device fsv2Debug flag. Admin-gated via AdminGatedPills wrapper.
 */

import React, { useEffect, useState } from 'react';
import { isFsv2DebugEnabled, setFsv2DebugEnabled, subscribe } from './hudBus';

export const Fsv2DebugToggle: React.FC = () => {
  const [on, setOn] = useState(isFsv2DebugEnabled());
  useEffect(() => subscribe(() => setOn(isFsv2DebugEnabled())), []);

  return (
    <button
      type="button"
      onClick={() => setFsv2DebugEnabled(!on)}
      aria-label="Toggle fsv2 debug HUD"
      style={{
        position: 'fixed',
        bottom: 80,
        left: 60,
        zIndex: 100000,
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'monospace',
        background: on ? 'rgba(34,211,238,0.22)' : 'rgba(0,0,0,0.7)',
        color: on ? '#22d3ee' : '#9ca3af',
        border: '1px solid rgba(34,211,238,0.45)',
        borderRadius: 6,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {on ? 'FSV2 ON' : 'FSV2'}
    </button>
  );
};

export default Fsv2DebugToggle;
