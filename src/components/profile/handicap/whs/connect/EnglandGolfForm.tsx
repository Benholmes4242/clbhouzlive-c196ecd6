import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fieldPaint, FIELD_HEIGHT, FIELD_INK } from '@/lib/tokens/field';
import { MUTE, DIM, BAD, FONT, LABEL_LG, INK, BORDER, PANEL } from './designTokens';
import { PrimaryButton, FooterBar, Action, Stage, StageHead } from './Primitives';

/** Derived from the server's error_code in WhsConnectScreen. Never from copy. */
export type FormErrorKind = 'rejected' | 'refreshing' | 'linked_elsewhere' | 'other' | null;

interface Props {
  errorKind?: FormErrorKind;
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
 * FIELD CANON (lib/tokens/field.ts): a 44px box, radius 14, rest/focus paint.
 * Replaces the earlier undecorated 24px input on a hairline so a member types a
 * membership number into the same box they type into everywhere else.
 * A rejected credential turns the border BAD.
 */
const Field: React.FC<{
  label: string;
  labelAside?: React.ReactNode;
  hint?: React.ReactNode;
  hintColor?: string;
  invalid?: boolean;
  input: (handlers: { onFocus: () => void; onBlur: () => void }) => React.ReactNode;
  first?: boolean;
}> = ({ label, labelAside, hint, hintColor, invalid, input, first }) => {
  const [focused, setFocused] = useState(false);
  const paint = fieldPaint(focused);
  return (
    <div style={{ paddingTop: first ? 0 : 30 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={LABEL_LG}>{label}</div>
        {labelAside}
      </div>
      <div
        style={{
          ...paint,
          ...(invalid ? { border: `1px solid ${BAD}` } : null),
          height: FIELD_HEIGHT,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
        }}
      >
        {input({ onFocus: () => setFocused(true), onBlur: () => setFocused(false) })}
      </div>
      {hint ? (
        <div style={{ fontSize: 12.5, color: hintColor ?? DIM, marginTop: 10, lineHeight: 1.5 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
};

const TRUST_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: INK,
};
const TRUST_BODY: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.5, color: MUTE, marginTop: 6 };

/* TRUST COPY. Every sentence is verified against the edge functions
   (connect-whs vault_create_secret; sync-whs-due / sync-whs-one /
   backfill-whs-holes decrypt; disconnect-whs / delete-whs-data / delete-account
   vault_delete_secret; eg-api.ts is read-only and records the single-use JWT).
   If any of that stops being true, this copy changes in the same commit. */
const trustRows = (body: string) => [
  {
    label: 'Why we need your password',
    body: `${body} issues a sign-in token that works once, so every sync has to sign in again. Yours is held in an encrypted vault and decrypted only to fetch your scores.`,
  },
  {
    label: 'We only ever read',
    body: `Your scores and your handicap record. Nothing is written back to ${body}, and a synced round is never posted anywhere.`,
  },
  {
    label: 'Disconnect and it is gone',
    body: 'One tap destroys the stored password. Deleting your account does the same.',
  },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 15,
  fontWeight: 400,
  color: FIELD_INK,
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
  errorKind = null,
}) => {
  const { t } = useTranslation('handicap');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);

  const isValid = membershipNumber.trim().length > 0 && password.length > 0;
  const disabled = !isValid || submitting;

  /* A rejected credential is the one error that belongs on the password field.
     'refreshing' is OUR fault and never touches the fields. Driven by the
     error_code-derived errorKind, never by matching display copy. */
  const rejected = errorKind === 'rejected';
  const refreshing = errorKind === 'refreshing';

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
      <Stage fill>
        <StageHead
          small
          kicker={t('whsConnect.steps.form', { body: bodyName })}
          headline="Sign in once."
          lead={`The same details you use for the ${bodyName} app.`}
        />

        {refreshing ? (
          <div
            role="status"
            style={{
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: 14,
              marginTop: 30,
            }}
          >
            <div style={TRUST_LABEL}>This one is ours</div>
            <div style={TRUST_BODY}>
              Our connection to {bodyName} is being refreshed — this is on our side, not yours. Leave
              your details exactly as they are and try again shortly.
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: refreshing ? 30 : 36 }}>
          <Field
            first
            label="Membership number"
            hint="Ten digits, on your member card"
            input={(h) => (
              <input
                {...h}
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
                inputMode="numeric"
                autoComplete="username"
                aria-label="Membership number"
                style={inputStyle}
              />
            )}
          />

          <Field
            label="Password"
            invalid={rejected}
            hintColor={rejected ? BAD : DIM}
            hint={rejected ? `${bodyName} did not accept those details.` : undefined}
            labelAside={
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-pressed={reveal}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                style={{
                  ...LABEL_LG,
                  letterSpacing: '0.13em',
                  color: INK,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            }
            input={(h) => (
              <input
                {...h}
                type={reveal ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-label="Password"
                aria-invalid={rejected}
                style={inputStyle}
              />
            )}
          />

          {error && !rejected && !refreshing ? (
            <div data-connect-error={errorKind ?? 'other'} style={{ fontSize: 13.5, color: BAD, marginTop: 24, lineHeight: 1.5 }}>{error}{errorKind === 'linked_elsewhere' && <span style={{ display: 'block', marginTop: 4 }}>Sign in to that account to see it, or use a different membership number.</span>}</div>
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
        <div style={{ marginTop: 'auto', paddingTop: 36 }}>
          {trustRows(bodyName).map((row, i) => (
            <div
              key={row.label}
              style={{ padding: '14px 0', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}
            >
              <div style={TRUST_LABEL}>{row.label}</div>
              <div style={TRUST_BODY}>{row.body}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 28, flexShrink: 0 }} />
      </Stage>

      <FooterBar>
        <PrimaryButton type="submit" disabled={disabled}>
          {rejected || refreshing ? 'Try again' : `Connect to ${bodyName}`}
        </PrimaryButton>
      </FooterBar>
    </form>
  );
};

export default EnglandGolfForm;
