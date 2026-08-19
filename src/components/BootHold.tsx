import React from 'react';

/**
 * Full-viewport dark hold shown while the auth session resolves on cold
 * start. Mirrors the AppDownloadGate frame exactly: fixed inset:0 at the
 * same top zIndex layer, on the splash canvas (#15171F). Both must move
 * together — a light hold in front of the dark gate flashes white on every
 * app launch.
 */
const BootHold: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      inset: 0,
      background: '#15171F',
      zIndex: 2147483000,
    }}
  />
);


export default BootHold;
