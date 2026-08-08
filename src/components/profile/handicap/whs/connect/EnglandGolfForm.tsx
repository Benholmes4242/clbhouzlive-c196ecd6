import React, { useState } from 'react';
import { INK, MUTE, DIM, BORDER, BAD, FONT, LABEL, H1, H1_SUB, KICKER } from './designTokens';
import { Panel, PrimaryButton, FooterBar, CopyBlock } from './Primitives';

interface Props {
  onSubmit: (membershipNumber: string, password: string) => void;
  error: string | null;
  submitting: boolean;
  /** Governing body of the chosen country - the FIRST time it is named. */
  bodyName?: string;
  /** Short product name for the credentials, e.g. MyEG. */
  bodyShort?: string;
  /** Kept for API compatibility - the header back chevron owns this now. */
  onChangeCountry?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  fontSize: 15,
  color: INK,
  fontFamily: FONT,
  outline: 'none',
  background: '#FFF',
  fontVariantNumeric: 'tabular-nums lining',
};

/** SCREEN 3 - SIGN IN. */
export const EnglandGolfForm: React.FC<Props> = ({
  onSubmit,
  error,
  submitting,
  bodyName = 'England Golf',
  bodyShort = 'MyEG',
}) => {
  const [membershipNumber, setMembershipNumber] = useState('');
  const [password, setPassword] = useState('');

  const isValid = membershipNumber.trim().length > 0 && password.length > 0;
  const disabled = !isValid || submitting;

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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 20px' }}>
        <CopyBlock kicker={bodyName}>
          <h1 style={{ ...H1, fontSize: 26, letterSpacing: '-0.03em' }}>
            Sign in to {bodyShort}
          </h1>
          <p style={{ ...H1_SUB, fontSize: 14.5, fontWeight: 500 }}>
            The same details you use with {bodyName}.
          </p>
        </CopyBlock>

        <Panel>
          <div style={{ ...LABEL, marginBottom: 7 }}>Membership number</div>
          <input
            value={membershipNumber}
            onChange={(e) => setMembershipNumber(e.target.value)}
            inputMode="numeric"
            autoComplete="username"
            aria-label="Membership number"
            style={inputStyle}
          />
          <div style={{ fontSize: 11.5, color: MUTE, marginTop: 7 }}>
            Ten digits, on your member card
          </div>

          <div style={{ ...LABEL, margin: '18px 0 7px' }}>{bodyShort} password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-label={`${bodyShort} password`}
            style={inputStyle}
          />
          <div style={{ fontSize: 11.5, color: DIM, marginTop: 7, lineHeight: 1.5 }}>
            Encrypted in a vault, never leaves our servers, delete it any time.
          </div>

          {error ? (
            <div style={{ fontSize: 12.5, color: BAD, marginTop: 14, lineHeight: 1.5 }}>{error}</div>
          ) : null}
        </Panel>

        <div style={{ ...KICKER, color: DIM, marginTop: 14, padding: '0 4px' }}>Step 2 of 2</div>
      </div>

      <FooterBar>
        <PrimaryButton type="submit" disabled={disabled}>
          Connect to {bodyName}
        </PrimaryButton>
      </FooterBar>
    </form>
  );
};

export default EnglandGolfForm;
