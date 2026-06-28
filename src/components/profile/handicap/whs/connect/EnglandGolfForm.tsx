import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { MiniFlag } from './MiniFlag';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  onSubmit: (membershipNumber: string, password: string) => void;
  error: string | null;
  submitting: boolean;
  onChangeCountry: () => void;
  onSkip?: () => void;
}

export const EnglandGolfForm: React.FC<Props> = ({
  onSubmit, error, submitting, onChangeCountry, onSkip,
}) => {
  const [membershipNumber, setMembershipNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isValid = membershipNumber.trim().length >= 8 && password.length > 0;

  return (
    <div style={{ padding: '8px 24px 28px', fontFamily: FONT }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#FFFFFF',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 18,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}
      >
        <MiniFlag iso="GB-ENG" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, color: INK_55,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            marginBottom: 1,
          }}>
            CONNECTING TO
          </div>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: INK,
            lineHeight: 1.2,
          }}>
            England Golf · MyEG
          </div>
        </div>
        <button
          onClick={onChangeCountry}
          disabled={submitting}
          style={{
            fontSize: 11, fontWeight: 700, color: AMBER,
            letterSpacing: '0.04em',
            background: 'transparent', border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.5 : 1,
            fontFamily: FONT,
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
      >
        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="whs-membership"
            style={{
              display: 'block',
              fontSize: 13, fontWeight: 600, color: INK,
              marginBottom: 6,
            }}
          >
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
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid rgba(15,23,42,0.14)',
              borderRadius: 12,
              fontSize: 15,
              background: '#fff',
              color: INK,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
              outline: 'none',
              opacity: submitting ? 0.5 : 1,
            }}
          />
          <div style={{ fontSize: 11.5, color: INK_55, marginTop: 5 }}>
            Find this on your member card or in MyEG
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="whs-password"
            style={{
              display: 'block',
              fontSize: 13, fontWeight: 600, color: INK,
              marginBottom: 6,
            }}
          >
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
              style={{
                width: '100%',
                padding: '12px 44px 12px 14px',
                border: '1px solid rgba(15,23,42,0.14)',
                borderRadius: 12,
                fontSize: 15,
                background: '#fff',
                color: INK,
                fontFamily: FONT,
                outline: 'none',
                opacity: submitting ? 0.5 : 1,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: 8,
                background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: INK_55,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: INK_55, marginTop: 5 }}>
            Same password you use for the MyEG app
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.16)',
              padding: '10px 12px', borderRadius: 10,
              fontSize: 13, color: '#B91C1C',
              marginBottom: 14, lineHeight: 1.45,
            }}
          >
            <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div
          style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: 'rgba(5,150,105,0.10)',
            border: '1px solid rgba(5,150,105,0.28)',
            padding: '12px 14px', borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={18} color={GREEN} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700, color: INK }}>Your password is safe.</span>{' '}
            Stored encrypted and used only to sync your handicap from England Golf. You can disconnect or delete it anytime.
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || submitting}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 999,
            background: !isValid || submitting
              ? 'rgba(15,23,42,0.06)'
              : 'linear-gradient(180deg, #FBA738 0%, #F7931E 100%)',
            color: !isValid || submitting ? 'rgba(15,23,42,0.35)' : '#fff',
            fontSize: 15, fontWeight: 700,
            border: 'none',
            cursor: !isValid || submitting ? 'not-allowed' : 'pointer',
            boxShadow: !isValid || submitting
              ? 'none'
              : '0 4px 16px rgba(247,147,30,0.28)',
            transition: 'transform 150ms',
            fontFamily: FONT,
          }}
        >
          Connect handicap
        </button>

        {onSkip && (
          <div style={{
            textAlign: 'center', fontSize: 13, color: INK_55,
            paddingTop: 14,
          }}>
            Not a member?{' '}
            <button
              type="button"
              onClick={onSkip}
              style={{
                color: INK, fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
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
