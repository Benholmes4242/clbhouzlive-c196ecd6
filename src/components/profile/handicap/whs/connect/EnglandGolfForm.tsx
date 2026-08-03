import React, { useState } from 'react';
import { INK, MUTE, BORDER, BAD, FONT, LABEL, H1, H1_SUB, CAPTION } from './designTokens';
import { Panel, PrimaryButton, FooterBar, CopyBlock } from './Primitives';

interface Props {
  onSubmit: (membershipNumber: string, password: string) => void;
  error: string | null;
  submitting: boolean;
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

/** SCREEN 3 - FORM. */
export const EnglandGolfForm: React.FC<Props> = ({ onSubmit, error, submitting }) => {
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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 16px' }}>
        <CopyBlock kicker="Step 2 of 2">
          <h1 style={{ ...H1, fontSize: 21 }}>Sign in to MyEG</h1>
          <p style={H1_SUB}>The same details you use for the England Golf app.</p>
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

          <div style={{ ...LABEL, margin: '18px 0 7px' }}>MyEG password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-label="MyEG password"
            style={inputStyle}
          />

          <div style={{ ...CAPTION, marginTop: 14 }}>
            Your password is encrypted in a secure vault and decrypted only when a sync runs. It
            never leaves our servers, and you can disconnect or delete it at any time.
          </div>

          {error ? (
            <div style={{ fontSize: 12.5, color: BAD, marginTop: 14, lineHeight: 1.5 }}>{error}</div>
          ) : null}
        </Panel>
      </div>

      <FooterBar>
        <PrimaryButton type="submit" disabled={disabled}>
          Connect to England Golf
        </PrimaryButton>
      </FooterBar>
    </form>
  );
};

export default EnglandGolfForm;
