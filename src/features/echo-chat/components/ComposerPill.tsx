/**
 * BRIEF_ECHO_CHAT — THE COMPOSER IS A GLASS PILL at the foot, present in every
 * state.
 *
 * NO WAVEFORM HERE. §5.3 / acceptance E: exactly one waveform is visible at a
 * time, and it belongs to the speaker mark in the thread. A second mark in the
 * composer is the duplicate glyph Ben caught.
 *
 * §7 the send action is INK, never amber.
 *
 * The ERROR state keeps the question in the composer, so the value is owned by
 * the page, never by this component.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { EC } from '../tokens';

export const ComposerPill: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  /** Keep the caret where a member left it — focused by default. */
  autoFocus?: boolean;
}> = ({ value, onChange, onSend, disabled = false, placeholder, autoFocus = false }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 92)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
  }, [autoFocus, disabled]);

  const submit = () => {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        padding: '10px 16px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
        flex: '0 0 auto',
      }}
    >
      <div
        className="ec-glass ec-glass--pill"
        style={{
          borderRadius: 999,
          padding: '9px 9px 9px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <textarea
          ref={ref}
          className="ec-input"
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          style={{ fontSize: 14.5, lineHeight: 1.4, paddingBottom: 6, maxHeight: 92 }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Ask Echo"
          className="active:opacity-70"
          style={{
            flex: '0 0 auto',
            width: 32,
            height: 32,
            borderRadius: 16,
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            // Two solid states, not one colour at two alphas (§1).
            background: canSend ? EC.INK : '#232A33',
          }}
        >
          <ArrowUp size={16} strokeWidth={2.6} color={canSend ? EC.BLACK : EC.INK_3} />
        </button>
      </div>
    </div>
  );
};
