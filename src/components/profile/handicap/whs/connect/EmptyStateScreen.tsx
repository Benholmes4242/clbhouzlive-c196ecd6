import React from 'react';
import { MUTE, H1, H1_SUB } from './designTokens';
import { PrimaryButton, Action, FooterBar } from './Primitives';
import HandicapCard from './HandicapCard';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

/** Illustrative series. Falls, so the line reads green. */
const PREVIEW_VALUES = [14.2, 14.0, 13.6, 13.7, 13.1, 12.8, 12.9, 12.4, 12.0, 11.8, 11.6, 11.4];

/**
 * SCREEN 1 - INTRO. Federation-neutral: no governing body is named here.
 * Also the decline surface - onDecline hides the connect chip and that
 * behaviour is unchanged.
 */
export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => (
  <>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '8px 16px 4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 24,
      }}
    >
      <HandicapCard
        kicker="Example profile"
        illustrative
        index={11.4}
        delta={-2.8}
        values={PREVIEW_VALUES}
        counters={{ rounds: 68, courses: 21, years: 4 }}
      />

      <div>
        <h1 style={{ ...H1, fontSize: 30, letterSpacing: '-0.035em' }}>
          Connect once.
          <br />
          Then it looks after itself.
        </h1>
        <p style={{ ...H1_SUB, fontSize: 14.5, fontWeight: 500 }}>
          Your official index and every round on your record, kept current without you typing a
          thing.
        </p>
      </div>
    </div>

    <FooterBar>
      <PrimaryButton onClick={onPickCountry}>Choose your country</PrimaryButton>
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
