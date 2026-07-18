import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { MiniFlag } from './MiniFlag';

const INK = '#0F172A';
const INK_45 = '#64748B';
const INK_30 = '#94A3B8';
const HAIR = 'rgba(15,23,42,0.08)';
const FIELD_FILL = '#F8FAFC';
const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.08)';
const DANGER = '#EF4444';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  onSubmit: (membershipNumber: string, password: string) => void;
  error: string | null;
  submitting: boolean;
  onChangeCountry: () => void;
}

const cardBase: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${HAIR}`,
  borderRadius: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: FIELD_FILL,
  border: `1px solid ${HAIR}`,
  borderRadius: 12,
  padding: '12px 13px',
  fontSize: 15,
  color: INK,
  fontFamily: FONT,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: INK_45,
  marginBottom: 6,
  display: 'block',
};

const helperStyle: React.CSSProperties = {
  fontSize: 12,
  color: INK_45,
  marginTop: 6,
};

export const EnglandGolfForm: React.FC<Props> = ({
  onSubmit,
  error,
  submitting,
  onChangeCountry,
  onSkip,
}) => {
  const [membershipNumber, setMembershipNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isValid = membershipNumber.trim().length >= 8 && password.length > 0;

  return (
    <div style={{ padding: '4px 0 12px', fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Connecting-to header card */}
      <div
        style={{
          ...cardBase,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <MiniFlag iso="GB-ENG" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: INK_45,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Connecting to
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>
            England Golf · MyEG
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeCountry}
          disabled={submitting}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: INK,
            background: 'transparent',
            border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.5 : 1,
            fontFamily: FONT,
            padding: '6px 4px',
          }}
        >
          Change
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValid || submitting) return;
          onSubmit(membershipNumber.trim(), password);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {/* Combined credentials card */}
        <div style={{ ...cardBase, padding: 16 }}>
          <div>
            <label htmlFor="whs-membership" style={labelStyle}>
              Membership number
            </label>
            <input
              id="whs-membership"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 1013726541"
              value={membershipNumber}
              onChange={(e) => setMembershipNumber(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={submitting}
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums', opacity: submitting ? 0.5 : 1 }}
            />
            <div style={helperStyle}>Find this on your member card or in MyEG</div>
          </div>

          <div style={{ height: 1, background: HAIR, margin: '16px 0' }} />

          <div>
            <label htmlFor="whs-password" style={labelStyle}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="whs-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your MyEG password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                style={{ ...inputStyle, paddingRight: 44, opacity: submitting ? 0.5 : 1 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: INK_45,
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div style={helperStyle}>Same password you use for the MyEG app</div>
          </div>
        </div>

        {/* Error panel */}
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.20)',
              padding: '12px 14px',
              borderRadius: 12,
              fontSize: 13,
              color: DANGER,
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ color: '#EF4444', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Reassurance panel */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            background: GREEN_BG,
            border: '1px solid rgba(5,150,105,0.24)',
            padding: '12px 14px',
            borderRadius: 12,
          }}
        >
          <ShieldCheck size={18} color={GREEN} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: INK }}>Your password is safe.</span>{' '}
            Stored encrypted and used only to sync your handicap from England Golf. You can disconnect or delete it anytime.
          </div>
        </div>

        {/* Connect button */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          style={{
            width: '100%',
            minHeight: 54,
            padding: '15px',
            borderRadius: 14,
            background: !isValid || submitting ? 'rgba(15,23,42,0.10)' : INK,
            color: !isValid || submitting ? INK_30 : '#fff',
            fontSize: 16,
            fontWeight: 600,
            border: 'none',
            cursor: !isValid || submitting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: FONT,
          }}
        >
          Connect official WHS handicap
          {isValid && !submitting && <ArrowRight size={18} strokeWidth={2.4} />}
        </button>

        {onSkip && (
          <div style={{ textAlign: 'center', fontSize: 13, color: INK_45, paddingTop: 4 }}>
            Not a member?{' '}
            <button
              type="button"
              onClick={onSkip}
              style={{
                color: INK,
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(15,23,42,0.30)',
                textUnderlineOffset: 3,
                fontFamily: FONT,
              }}
            >
              Skip for now
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EnglandGolfForm;
