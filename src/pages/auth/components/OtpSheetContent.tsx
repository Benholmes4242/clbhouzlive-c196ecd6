import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

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
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
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

  return (
    <div className="space-y-5">
      {/* Subtitle */}
      <div className="space-y-2 text-center">
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
          We sent a code to{' '}
          <span style={{ color: 'rgba(255,255,255,0.90)', fontWeight: 600 }}>{email}</span>
        </p>
        <button
          type="button"
          onClick={onUseDifferentEmail}
          className="text-[13px] underline underline-offset-2"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Use a different email
        </button>
      </div>

      {/* Code boxes */}
      <div className="flex items-center justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            inputMode="numeric"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={submitting}
            aria-label={`Digit ${i + 1}`}
            className="text-center focus:outline-none transition-colors"
            style={{
              width: 44,
              height: 52,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${d ? '#F7931E' : 'rgba(255,255,255,0.12)'}`,
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 600,
              caretColor: '#F7931E',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#F7931E';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = d ? '#F7931E' : 'rgba(255,255,255,0.12)';
            }}
          />
        ))}
      </div>

      {/* Error / Info */}
      {errorMessage && (
        <p className="text-[13px] text-center" style={{ color: '#f87171' }}>
          {errorMessage}
        </p>
      )}
      {infoMessage && !errorMessage && (
        <p className="text-[13px] text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {infoMessage}
        </p>
      )}

      {/* Verify CTA */}
      <button
        type="button"
        onClick={handleManualSubmit}
        disabled={!canSubmit}
        aria-label="Verify code"
        className="w-full h-[54px] flex items-center justify-center gap-2 rounded-[14px] font-bold text-[15px] transition-all duration-150 active:scale-[0.98]"
        style={{
          background: canSubmit ? '#F7931E' : 'rgba(255,255,255,0.05)',
          color: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
          border: canSubmit ? 'none' : '1px solid rgba(255,255,255,0.10)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Verify'}
      </button>

      {/* Resend */}
      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={resendCooldown > 0 || submitting}
          className="text-[13px]"
          style={{
            color: resendCooldown > 0 ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.60)',
            textDecoration: resendCooldown > 0 ? 'none' : 'underline',
            textUnderlineOffset: 2,
            cursor: resendCooldown > 0 ? 'default' : 'pointer',
          }}
        >
          {resendCooldown > 0
            ? `Resend code (${resendCooldown}s) — check spam too`
            : "Didn't get it? Resend code — check spam too"}
        </button>
      </div>
    </div>
  );
};

export default OtpSheetContent;
