import React from 'react';
import { INK, MUTE, DIM, BORDER, GOOD, LABEL, CAPTION, NUM } from './designTokens';
import { FlowBody, FlowHead } from './Primitives';

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
  <FlowBody>
    <FlowHead
      kicker="Connecting"
      kickerColor={GOOD}
      size={27}
      headline="Pulling your record."
      sub="Under a minute for most accounts. It finishes on our servers either way."
    />

    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, margin: '22px 0 18px' }}>
      <div
        style={{
          fontSize: 46,
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

    <div>
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

    <div style={{ ...CAPTION, marginTop: 18, color: DIM, paddingBottom: 24 }}>
      The count arrives with the import. Long records take a little longer.
    </div>
  </FlowBody>
);

export default SyncingScreen;
