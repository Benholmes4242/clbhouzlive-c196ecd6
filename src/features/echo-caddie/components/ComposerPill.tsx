/**
 * BRIEF_ECHO_CADDIE §6.3 — THE COMPOSER IS A GLASS PILL at the foot, present in
 * every state. §6.2: no chat chrome — no avatar, no send bubble, no typing dots.
 *
 * §5.4 the ERROR state keeps the question in the composer, so the value is owned
 * by the page, never by this component.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { EC, T } from '../tokens';
import { EchoWaveform } from './EchoWaveform';

export const ComposerPill: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  disabled?: boolean;
  /** True while Echo is thinking or speaking — the only time the mark moves. */
  active?: boolean;
  placeholder: string;
}> = ({ value, onChange, onSend, disabled = false, active = false, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 92)}px`;
  }, [value]);

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
      }}
    >
      <div
        className="ec-glass ec-glass--pill"
        style={{
          borderRadius: 26,
          padding: '10px 10px 10px 14px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        <span style={{ paddingBottom: 5, flex: '0 0 auto' }}>
          <EchoWaveform size={22} active={active} />
        </span>
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
          style={{ ...T.ADVICE, color: EC.INK, paddingBottom: 4, maxHeight: 92 }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Ask Echo"
          className="active:opacity-70"
          style={{
            flex: '0 0 auto',
            width: 34,
            height: 34,
            borderRadius: 17,
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            // Two solid states, not one colour at two alphas (§7).
            background: canSend ? EC.INK : '#2A2F36',
          }}
        >
          <ArrowUp size={17} strokeWidth={2.6} color={canSend ? EC.BLACK : EC.INK_3} />
        </button>
      </div>
    </div>
  );
};
