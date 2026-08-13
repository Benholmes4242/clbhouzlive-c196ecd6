import React, { useState } from 'react';
import { INK, MUTE, DIM, BORDER, BAD, FONT, LABEL_LG } from './designTokens';
import { PrimaryButton, FooterBar, Action, Stage, StageHead } from './Primitives';

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

/**
 * Undecorated field: no box. A hairline under the input is the whole chrome, so
 * the field belongs to the stage rather than sitting in a panel.
 */
const Field: React.FC<{
  label: string;
  hint: React.ReactNode;
  hintColor?: string;
  invalid?: boolean;
  input: React.ReactNode;
  first?: boolean;
}> = ({ label, hint, hintColor, invalid, input, first }) => (
  <div style={{ paddingTop: first ? 0 : 30 }}>
    <div style={{ ...LABEL_LG, marginBottom: 10 }}>{label}</div>
    {input}
    <div style={{ height: 1, background: invalid ? BAD : BORDER, marginTop: 10 }} />
    <div style={{ fontSize: 12.5, color: hintColor ?? DIM, marginTop: 10, lineHeight: 1.5 }}>
      {hint}
    </div>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: INK,
  fontFamily: FONT,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

/**
 * STAGE 3 - SIGN IN, and its rejected-credential state.
 *
 * CREDENTIAL TRUTH: the password IS stored. connect-whs writes it to Supabase
 * Vault against the connection row, and sync-whs-due decrypts it for each
 * scheduled sync (whs_connections.vault_secret_id). Disconnect and account
 * deletion both call vault_delete_secret. The hint says exactly that - it must
 * never imply the password is used once and discarded.
 */
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
      <Stage>
        <StageHead
          small
          kicker={bodyName}
          headline="Sign in once."
          lead={`The same details you use for the ${bodyName} app.`}
        />

        <div style={{ marginTop: 36 }}>
          <Field
            first
            label="Membership number"
            hint="Ten digits, on your member card"
            input={
              <input
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
                inputMode="numeric"
                autoComplete="username"
                aria-label="Membership number"
                style={inputStyle}
              />
            }
          />

          <Field
            label="Password"
            invalid={rejected}
            hintColor={rejected ? BAD : DIM}
            hint={
              rejected
                ? `${bodyName} did not accept those details.`
                : `Kept encrypted in a vault and decrypted only to run a sync. Disconnect and it is deleted.`
            }
            input={
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-label="Password"
                aria-invalid={rejected}
                style={inputStyle}
              />
            }
          />

          {error && !rejected ? (
            <div style={{ fontSize: 13.5, color: BAD, marginTop: 24, lineHeight: 1.5 }}>{error}</div>
          ) : null}

          {rejected ? (
            <div style={{ marginTop: 24 }}>
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
        </div>
        <div style={{ height: 28 }} />
      </Stage>

      <FooterBar>
        <PrimaryButton type="submit" disabled={disabled}>
          {rejected ? 'Try again' : `Connect to ${bodyName}`}
        </PrimaryButton>
      </FooterBar>
    </form>
  );
};

export default EnglandGolfForm;
