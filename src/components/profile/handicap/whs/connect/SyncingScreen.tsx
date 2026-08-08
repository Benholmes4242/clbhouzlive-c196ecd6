import React from 'react';
import { INK, MUTE, DIM, BORDER, GOOD, LABEL, H1, H1_SUB, CAPTION, NUM } from './designTokens';
import { CopyBlock } from './Primitives';

/**
 * SCREEN 4 - SYNCING. No spinner.
 *
 * connect-whs is ONE synchronous call that returns only when the whole import
 * is finished - it streams nothing back, and the connection row (and therefore
 * whs_imported_counts) does not exist until it resolves. So there is NO real
 * rounds-so-far figure to count up here, and a fabricated one on this screen
 * would be the worst possible place for one.
 *
 * The figure slot is therefore held with an em dash and labelled honestly. The
 * three steps are a STATEMENT of what the server is doing, in order - no ticks,
 * because we cannot know which one it has reached.
 */
const STEPS = ['Signing you in', 'Reading your record', 'Importing rounds'] as const;

export const SyncingScreen: React.FC = () => (
  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 20px' }}>
    <CopyBlock kicker="Connecting" kickerColor={GOOD}>
      <h1 style={{ ...H1, fontSize: 26, letterSpacing: '-0.03em' }}>Pulling your record</h1>
      <p style={{ ...H1_SUB, fontSize: 14.5, fontWeight: 500 }}>
        Under a minute for most accounts. You can leave - it finishes either way.
      </p>
    </CopyBlock>

    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '0 4px 18px' }}>
      <div
        style={{
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 0.92,
          color: DIM,
          ...NUM,
        }}
      >
        {'\u2014'}
      </div>
      <div style={{ ...LABEL, color: MUTE }}>rounds so far</div>
    </div>

    <div style={{ padding: '0 4px' }}>
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
    </div>

    <div style={{ ...CAPTION, marginTop: 18, color: DIM, padding: '0 4px' }}>
      The count arrives with the import. Long records take a little longer.
    </div>
  </div>
);

export default SyncingScreen;
