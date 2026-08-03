import React from 'react';
import { INK, MUTE, AMBER_DEEP, LABEL, H1, H1_SUB, BORDER } from './designTokens';
import { Panel, PanelGap, PrimaryButton, Action, FooterBar, CopyBlock } from './Primitives';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

const ROWS: Array<{ when: string; title: string; sub: string }> = [
  {
    when: 'Day one',
    title: 'Every round England Golf holds for you comes across',
    sub: 'However far back it goes',
  },
  {
    when: 'Within hours',
    title: 'Your index moves as counting rounds land',
    sub: 'You never type a score in',
  },
  {
    when: 'Straight away',
    title: 'You can see which holes are costing you shots',
    sub: 'And where rounds tend to slip',
  },
  {
    when: 'Straight away',
    title: 'Friends from your club who are already here',
    sub: 'Compare your game to any of them',
  },
];

/**
 * SCREEN 1 - INTRO. Also the decline surface: onDecline hides the connect chip,
 * which is behaviour the old empty state owned and must survive.
 */
export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => (
  <>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
      <CopyBlock kicker="England Golf">
        <h1 style={{ ...H1, fontSize: 25, letterSpacing: '-0.025em' }}>
          Connect once.
          <br />
          Then it looks after itself.
        </h1>
        <p style={H1_SUB}>
          Your official index and every round England Golf holds for you, in clbhouz in about a minute.
        </p>
      </CopyBlock>

      <Panel kicker="What changes">
        {ROWS.map((r, i) => (
          <div
            key={r.title}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'baseline',
              padding: i === 0 ? '0 0 13px' : '13px 0',
              borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
            }}
          >
            <div style={{ ...LABEL, color: AMBER_DEEP, width: 78, flexShrink: 0 }}>{r.when}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.35 }}>
                {r.title}
              </div>
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3 }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </Panel>
      <PanelGap />
    </div>

    <FooterBar>
      <PrimaryButton onClick={onPickCountry}>Start with your country</PrimaryButton>
      {onDecline ? (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <Action onClick={onDecline} color={MUTE}>
            I don't hold an official handicap
          </Action>
        </div>
      ) : null}
    </FooterBar>
  </>
);

export default EmptyStateScreen;
