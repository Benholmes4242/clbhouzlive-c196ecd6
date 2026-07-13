import React from 'react';

/**
 * Full-viewport neutral light hold shown while the auth session resolves
 * on cold start. Mirrors index.html's pre-React shell (#F8FAFC), the
 * native splash, the auth screen, and the AppDownloadGate — so
 * splash -> hold -> (auth | gate | clubhouse) has zero color jump and
 * no black first frame.
 */
const BootHold: React.FC = () => (
  <div
    aria-hidden
    style={{ position: 'fixed', inset: 0, background: '#F8FAFC', zIndex: 0 }}
  />
);

export default BootHold;
