import React, { useState } from 'react';
import { INK, MUTE, DIM, BORDER, BAD, FONT, LABEL } from './designTokens';
import { Panel, PrimaryButton, FooterBar, Action, FlowBody, FlowHead } from './Primitives';

interface Props {
  onSubmit: (membershipNumber: string, password: string) => void;
  error: string | null;
  submitting: boolean;
  /** Governing body of the chosen country - the FIRST time it is named. */
  bodyName?: string;
  /** Kept for API compatibility. The screen names ONE thing: the federation. */
  bodyShort?: string;
  /** Kept for API compatibility - the header back control owns this now. */
  onChangeCountry?: () => void;
}

const inputStyle = (invalid: boolean): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: `1px solid ${invalid ? BAD : BORDER}`,
  borderRadius: 10,
  fontSize: 15,
  color: INK,
  fontFamily: FONT,
  outline: 'none',
  background: '#FFF',
  fontVariantNumeric: 'tabular-nums lining-nums',
});

/** SCREEN 3 - SIGN IN, and its rejected-credential state. */
export const EnglandGolfForm: React.FC<Props> = ({
  onSubmit,
  error,
  submitting,
  bodyName = 'England Golf',
}) => {
  const [membershipNumber, setMembershipNumber] = useState('');
  const [password, setPassword] = useState('');

  const isValid = membershipNumber.trim().length > 0 && password.length > 0;
  const disabled = !isValid || submitting;

  /* A rejected credential is the one error that belongs on the password field.
     Everything else (federation down, our side, already linked) reads as a
     neutral message and must NOT tell a member their details are wrong. */
  const rejected = !!error && /didn't recognise|did not accept/i.test(error);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        onSubmit(membershipNumber.trim(), password);
      }}
      className="flex flex-col flex-1 min-h-0"
      style={{ fontFamily: FONT }}
    >
      <FlowBody>
        <FlowHead
          kicker={bodyName}
          size={27}
          headline="Sign in once."
          sub={`The same details you use for the ${bodyName} app.`}
        />

        <div style={{ marginTop: 22 }}>
          <Panel>
            <div style={{ ...LABEL, marginBottom: 7 }}>Membership number</div>
            <input
              value={membershipNumber}
              onChange={(e) => setMembershipNumber(e.target.value)}
              inputMode="numeric"
              autoComplete="username"
              aria-label="Membership number"
              style={inputStyle(false)}
            />
            <div style={{ fontSize: 11.5, color: MUTE, marginTop: 7 }}>
              Ten digits, on your member card
            </div>

            <div style={{ ...LABEL, margin: '18px 0 7px' }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-label="Password"
              aria-invalid={rejected}
              style={inputStyle(rejected)}
            />
            <div
              style={{
                fontSize: 11.5,
                color: rejected ? BAD : DIM,
                marginTop: 7,
                lineHeight: 1.5,
              }}
            >
              {rejected
                ? `${bodyName} did not accept those details.`
                : 'Encrypted, never leaves our servers, delete it any time.'}
            </div>

            {error && !rejected ? (
              <div style={{ fontSize: 12.5, color: BAD, marginTop: 14, lineHeight: 1.5 }}>
                {error}
              </div>
            ) : null}

            {rejected ? (
              <div style={{ marginTop: 14 }}>
                <Action
                  onClick={() =>
                    window.open('https://www.englandgolf.org/forgotten-password/', '_blank', 'noopener')
                  }
                  color={MUTE}
                >
                  Forgotten your password?
                </Action>
              </div>
            ) : null}
          </Panel>
        </div>
        <div style={{ height: 24 }} />
      </FlowBody>

      <FooterBar>
        <PrimaryButton type="submit" disabled={disabled}>
          {rejected ? 'Try again' : `Connect to ${bodyName}`}
        </PrimaryButton>
      </FooterBar>
    </form>
  );
};

export default EnglandGolfForm;
