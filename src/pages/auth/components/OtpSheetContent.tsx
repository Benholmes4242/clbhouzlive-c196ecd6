import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LABEL, BODY, FIGURE } from '@/lib/tokens/type';

interface OtpSheetContentProps {
  email: string;
  submitting: boolean;
  errorMessage: string | null;
  infoMessage?: string | null;
  resendCooldown: number;
  onVerify: (code: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
  onUseDifferentEmail: () => void;
  /** Bumped by parent when an error fires so we can clear/refocus. */
  errorNonce?: number;
  /** Called when the user starts editing the code so the parent can clear transient notices. */
  onCodeEdit?: () => void;
}

const BOX_COUNT = 6;

const OtpSheetContent: React.FC<OtpSheetContentProps> = ({
  email,
  submitting,
  errorMessage,
  infoMessage,
  resendCooldown,
  onVerify,
  onResend,
  onUseDifferentEmail,
  errorNonce = 0,
  onCodeEdit,
}) => {
  const { t } = useTranslation('auth');
  const [digits, setDigits] = useState<string[]>(() => Array(BOX_COUNT).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hasAutoSubmittedRef = useRef(false);

  // Focus first box on mount
  useEffect(() => {
    const id = setTimeout(() => inputsRef.current[0]?.focus(), 80);
    return () => clearTimeout(id);
  }, []);

  // On error: clear boxes, refocus first
  useEffect(() => {
    if (errorNonce === 0) return;
    setDigits(Array(BOX_COUNT).fill(''));
    hasAutoSubmittedRef.current = false;
    requestAnimationFrame(() => inputsRef.current[0]?.focus());
  }, [errorNonce]);

  const setDigit = (i: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const tryAutoSubmit = (next: string[]) => {
    const code = next.join('');
    if (code.length === BOX_COUNT && /^\d{6}$/.test(code) && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      onVerify(code);
    }
  };

  const handleChange = (i: number, raw: string) => {
    onCodeEdit?.();
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      setDigit(i, '');
      return;
    }

    // Paste: multi-char input – distribute across boxes from current index
    if (cleaned.length > 1) {
      // Overwrite guard: typing into a filled box yields "<old><new>" - treat as retype
      if (cleaned.length === 2 && cleaned[0] === digits[i]) {
        setDigit(i, cleaned[1]);
        if (i < BOX_COUNT - 1) {
          requestAnimationFrame(() => inputsRef.current[i + 1]?.focus());
        }
        const next = [...digits];
        next[i] = cleaned[1];
        tryAutoSubmit(next);
        return;
      }
      const chars = cleaned.slice(0, BOX_COUNT - i).split('');
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, idx) => {
          next[i + idx] = c;
        });
        const lastIdx = Math.min(i + chars.length, BOX_COUNT) - 1;
        requestAnimationFrame(() => {
          const focusIdx = Math.min(i + chars.length, BOX_COUNT - 1);
          inputsRef.current[focusIdx]?.focus();
        });
        tryAutoSubmit(next);
        void lastIdx;
        return next;
      });
      return;
    }

    // Single char
    const digit = cleaned.slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigit(i, digit);
    if (i < BOX_COUNT - 1) {
      inputsRef.current[i + 1]?.focus();
    }
    tryAutoSubmit(next);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      onCodeEdit?.();
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < BOX_COUNT - 1) {
      e.preventDefault();
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    onCodeEdit?.();
    const text = e.clipboardData.getData('text');
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= BOX_COUNT) {
      e.preventDefault();
      const chars = cleaned.slice(0, BOX_COUNT).split('');
      setDigits(chars);
      requestAnimationFrame(() => inputsRef.current[BOX_COUNT - 1]?.blur());
      tryAutoSubmit(chars);
    }
  };

  const code = digits.join('');
  const canSubmit = code.length === BOX_COUNT && !submitting;
  const verifyActiveLook = canSubmit || submitting;

  const handleManualSubmit = () => {
    if (!canSubmit) return;
    hasAutoSubmittedRef.current = true;
    onVerify(code);
  };

  return (
    <div className="space-y-4">
      {/* Sent-to */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ ...LABEL, color: 'rgba(255,255,255,0.60)', margin: 0 }}>
          {t('otp.sentTo')}
        </p>
        <p style={{ ...BODY, margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.96)', fontWeight: 600 }}>{email}</span>
          <button
            type="button"
            onClick={onUseDifferentEmail}
            style={{ ...BODY, fontWeight: 600, color: '#FFFFFF', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {t('otp.changeEmail')}
          </button>
        </p>
      </div>

      {/* Code boxes */}
      <div className="flex items-center justify-center gap-2.5">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}

            disabled={submitting}
            aria-label={t('otp.digitLabel', { index: i + 1 })}
            className="text-center focus:outline-none transition-colors"
            style={{
              flex: '1 1 0',
              maxWidth: 52,
              height: 56,
              borderRadius: 14,
              background: '#272C37',
              border: `1px solid ${d ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)'}`,
              transition: 'border-color 150ms ease',
              color: 'rgba(255,255,255,0.96)',
              ...FIGURE,
              fontSize: 21,
              fontWeight: 600,
              caretColor: '#FFFFFF',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = d ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)';
            }}
          />
        ))}
      </div>

      {/* Error / Info */}
      {errorMessage && (
        <p className="text-center" style={{ ...BODY, color: '#F87171' }}>
          {errorMessage}
        </p>
      )}
      {infoMessage && !errorMessage && (
        <p className="text-center" style={{ ...BODY, color: 'rgba(255,255,255,0.96)' }}>
          {infoMessage}
        </p>
      )}

      {/* Verify CTA */}
      <button
        type="button"
        onClick={handleManualSubmit}
        disabled={!canSubmit}
        aria-label={t('otp.verifyAria')}
        className="w-full h-[54px] flex items-center justify-center gap-2 rounded-[16px] font-bold text-[15px] transition-all duration-150 active:scale-[0.98]"
        style={{
          background: verifyActiveLook ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
          boxShadow: verifyActiveLook ? '0 6px 20px rgba(255,255,255,0.18)' : 'none',
          color: verifyActiveLook ? '#0A0D12' : 'rgba(255,255,255,0.38)',
          border: verifyActiveLook ? 'none' : '1px solid rgba(255,255,255,0.10)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : t('otp.verify')}
      </button>

      {/* Resend */}
      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={resendCooldown > 0 || submitting}
          style={{
            ...BODY,
            color: resendCooldown > 0 ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.55)',
            cursor: resendCooldown > 0 ? 'default' : 'pointer',
          }}
        >
          {resendCooldown > 0
            ? t('otp.resendCountdown', { seconds: resendCooldown })
            : <>{t('otp.resendPromptPrefix')}<span style={{ color: '#FFFFFF', fontWeight: 600 }}>{t('otp.resendPromptCta')}</span></>}
        </button>
      </div>
    </div>
  );
};

export default OtpSheetContent;
