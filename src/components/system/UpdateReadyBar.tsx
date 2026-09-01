import React, { useEffect, useState } from 'react';
import {
  installBuildFreshnessCheck,
  subscribeBuildFreshness,
  dismissUpdate,
} from '@/lib/buildFreshness';

/**
 * Quiet, dismissible bar shown when the served build id no longer matches the
 * one this bundle was compiled with. Never reloads on its own — the member
 * chooses. Dismissal lasts the session (see buildFreshness).
 */
export default function UpdateReadyBar() {
  const [stale, setStale] = useState<string | null>(null);

  useEffect(() => {
    installBuildFreshnessCheck();
    return subscribeBuildFreshness(setStale);
  }, []);

  if (!stale) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: `calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-h, 64px) + 12px)`,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 12,
        background: '#1C1F29',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.42)',
      }}
    >
      <span style={{ flex: 1, minWidth: 0, color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>
        A new version of clbhouz is ready
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          background: '#F7931E',
          color: '#15171F',
          border: 'none',
          borderRadius: 8,
          padding: '7px 14px',
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        Update
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismissUpdate()}
        style={{
          background: 'transparent',
          color: '#94A3B8',
          border: 'none',
          borderRadius: 8,
          padding: '7px 8px',
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        Later
      </button>
    </div>
  );
}
