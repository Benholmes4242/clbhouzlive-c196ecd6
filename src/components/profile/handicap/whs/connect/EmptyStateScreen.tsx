import React from 'react';
import { MUTE } from './designTokens';
import { PrimaryButton, Action, FooterBar, FlowBody, FlowHead } from './Primitives';
import HandicapCard from './HandicapCard';

interface Props {
  onPickCountry: () => void;
  onDecline?: () => void;
}

/** Illustrative series. Falls, so the line reads green. */
const PREVIEW_VALUES = [14.2, 14.0, 13.6, 13.7, 13.1, 12.8, 12.9, 12.4, 12.0, 11.8, 11.6, 11.4];

/**
 * SCREEN 1 - INTRO. Federation-neutral: no governing body is named here.
 * Claim before evidence: headline, sub, THEN the example card.
 * Also the decline surface - onDecline is unchanged in behaviour.
 */
export const EmptyStateScreen: React.FC<Props> = ({ onPickCountry, onDecline }) => (
  <>
    <FlowBody>
      <FlowHead
        headline={
          <>
            Connect once.
            <br />
            Then it looks after itself.
          </>
        }
        sub="Your official index and every round on your record, kept current without you typing a thing."
      />

      <div style={{ marginTop: 22 }}>
        <HandicapCard
          kicker="Example profile"
          index={11.4}
          delta={-2.8}
          values={PREVIEW_VALUES}
          counters={{ rounds: 68, courses: 21, years: 4 }}
        />
      </div>
    </FlowBody>

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
