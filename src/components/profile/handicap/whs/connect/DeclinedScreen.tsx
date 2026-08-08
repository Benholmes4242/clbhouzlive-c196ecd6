import React from 'react';
import { MUTE, BORDER, INK } from './designTokens';
import { PrimaryButton, Action, FooterBar, FlowBody, FlowHead } from './Primitives';

interface Props {
  /** Into the app. */
  onContinue: () => void;
  /** Back into the flow. */
  onReconsider: () => void;
}

const WORKS = [
  'Rate and review the courses you play',
  'Follow players and clubs in the clubhouse',
  'Follow every tour, round by round',
] as const;

/**
 * DECLINED. "I don't hold an official handicap" lands somewhere real.
 * The decline side effect itself (hiding the connect chip) is owned by the
 * caller's onDecline and is unchanged.
 */
export const DeclinedScreen: React.FC<Props> = ({ onContinue, onReconsider }) => (
  <>
    <FlowBody>
      <FlowHead
        headline="No handicap, no problem."
        sub="Almost none of clbhouz needs one. Connect whenever you get one - it takes a minute."
      />

      <div style={{ marginTop: 22 }}>
        {WORKS.map((line, i) => (
          <div
            key={line}
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: INK,
              padding: i === 0 ? '0 0 12px' : '12px 0',
              borderTop: i === 0 ? undefined : `1px solid ${BORDER}`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </FlowBody>

    <FooterBar>
      <PrimaryButton onClick={onContinue}>Carry on to the app</PrimaryButton>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <Action onClick={onReconsider} color={MUTE}>
          Actually, I do hold one
        </Action>
      </div>
    </FooterBar>
  </>
);

export default DeclinedScreen;
