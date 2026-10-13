import React from 'react';
import { INK } from './designTokens';

/** Shared "Count me in / Waiting" state label for waitlist rows and ComingSoonScreen. */
export const WAIT_IDLE_INK = 'rgba(248,250,252,0.42)';

export const WAITLIST_STATE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

export const WaitlistState: React.FC<{ joined: boolean }> = ({ joined }) => (
  <span style={{ ...WAITLIST_STATE, color: joined ? INK : WAIT_IDLE_INK }}>
    {joined ? 'Waiting \u2713' : 'Count me in \u203A'}
  </span>
);
