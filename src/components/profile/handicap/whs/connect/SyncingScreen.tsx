import React from 'react';
import { INK, BORDER, MUTE, H1, H1_SUB, CAPTION } from './designTokens';
import { Panel, Indeterminate, CopyBlock } from './Primitives';

/**
 * SCREEN 4 - SYNCING.
 * connect-whs is a single synchronous call, so there is no running count to
 * report. The four rows are a STATEMENT of what the server is doing, not a
 * tracker: no changing dots, no "2 of 4", no percentage.
 */
const STEPS = [
  'Signing in to England Golf',
  'Saving your index',
  'Reading your scoring record',
  'Finding friends at your club',
] as const;

export const SyncingScreen: React.FC = () => (
  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
    <CopyBlock kicker="England Golf">
      <h1 style={{ ...H1, fontSize: 21 }}>Pulling your record</h1>
      <p style={H1_SUB}>
        Under a minute for most accounts. You can close this - it finishes on our side either way.
      </p>
    </CopyBlock>

    <Indeterminate />

    <Panel kicker="What's happening" aside="in order">
      {STEPS.map((label, i) => (
        <div
          key={label}
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: INK,
            padding: i === 0 ? '0 0 12px' : '12px 0',
            borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
          }}
        >
          {label}
        </div>
      ))}
    </Panel>

    <div style={{ ...CAPTION, marginTop: 18, textAlign: 'center', color: MUTE }}>
      Long records take a little longer. Nothing is lost if you leave.
    </div>
  </div>
);

export default SyncingScreen;
