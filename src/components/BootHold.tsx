import React from 'react';

/**
 * Full-viewport neutral charcoal hold shown while the auth session resolves
 * on cold start. Mirrors index.html's pre-React shell (#15171F) and the
 * native splash, so splash -> hold -> (auth | clubhouse) has zero color jump.
 *
 * Returned as the FIRST branch of RootGate so a logged-out
 * cold launch never falls through to <ClubhouseWrapped/> and flashes feed
 * skeletons before the /auth redirect.
 */
const BootHold: React.FC = () => (
  <div
    aria-hidden
    style={{ position: 'fixed', inset: 0, background: '#15171F', zIndex: 0 }}
  />
);

export default BootHold;
