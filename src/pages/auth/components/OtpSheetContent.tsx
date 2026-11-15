import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  submitting,
  errorMessage,
  infoMessage,
  resendCooldown,
  onVerify,
  onResend,
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

  const handleManualSubmit = () => {
    if (!canSubmit) return;
    hasAutoSubmittedRef.current = true;
    onVerify(code);
  };

  // Markup only: the six-box logic (paste, auto-submit, backspace, arrows,
  // one-time-code autocomplete, clear/refocus on error) is unchanged. The
  // sent-to sentence with Change lives in AuthHeroScreen's code panel.
  return (
    <>
      {/* Code boxes */}
      <div className="auth-hero-otp-boxes">
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
            className="auth-hero-otp-box"
          />
        ))}
      </div>

      {/* Error / Info */}
      {errorMessage && (
        <p role="alert" key={errorNonce} className="auth-hero-error auth-error-fade">
          {errorMessage}
        </p>
      )}
      {infoMessage && !errorMessage && (
        <p className="auth-hero-otp-info">
          {infoMessage}
        </p>
      )}

      {/* Verify CTA: the shared white pill, dark until all six digits are in. */}
      <button
        type="button"
        onClick={handleManualSubmit}
        disabled={!canSubmit}
        aria-label={t('otp.verifyAria')}
        className="auth-hero-pill auth-hero-send"
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : t('otp.verify')}
      </button>

      {/* Foot: resend line, then where else to look (codes land in Junk). */}
      <div className="auth-hero-otp-foot">
        <span>
          {resendCooldown > 0
            ? t('otp.resendCountdown', { seconds: resendCooldown })
            : (
              <button
                type="button"
                className="auth-hero-otp-resend"
                onClick={onResend}
                disabled={submitting}
              >
                {t('otp.resendPromptPrefix')}<b>{t('otp.resendPromptCta')}</b>
              </button>
            )}
        </span>
        <span>{t('otp.junkHint')}</span>
      </div>
    </>
  );
};

export default OtpSheetContent;
