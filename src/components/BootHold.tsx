import React from 'react';

/**
 * Full-viewport neutral light hold shown while the auth session resolves
 * on cold start. Mirrors the AppDownloadGate frame exactly: fixed inset:0
 * at the same top zIndex layer, on the app canvas (#F8FAFC). This
 * guarantees a web visitor's sequence is: plain light frame -> gate,
 * with app chrome (header islands, bottom nav) never visible behind it.
 */
const BootHold: React.FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      inset: 0,
      background: '#F8FAFC',
      zIndex: 2147483000,
    }}
  />
);

export default BootHold;
