import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';


const INK = '#1F2428';
const HINT = '#AEB4BC';
const HAIRLINE = 'rgba(0,0,0,0.07)';
const COMPOSER_BG = '#FFFFFF';
const COMPOSER_INPUT_BG = '#EDEFF2';
const SEND_BG = '#15171F';
const SEND_FG = '#F5F6F7';

const LINE_HEIGHT = 20;
const MAX_LINES = 5;
const MIN_HEIGHT = 36;
const MAX_HEIGHT = MIN_HEIGHT + LINE_HEIGHT * (MAX_LINES - 1);

interface Props {
  disabled?: boolean;
  value?: string;
  onValueChange?: (v: string) => void;
  onSend: (text: string) => void;
  onHeightChange?: (heightPx: number) => void;
}

export const EchoComposer: React.FC<Props> = ({ disabled, value, onValueChange, onSend, onHeightChange }) => {
  const keyboardHeight = useKeyboardHeight();
  const [internal, setInternal] = useState('');
  const text = value !== undefined ? value : internal;
  const setText = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canSend = text.trim().length > 0 && !disabled;

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [text]);

  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const el = containerRef.current;
    if (!el) return;
    onHeightChange(el.getBoundingClientRect().height);
  }, [onHeightChange, text, keyboardHeight]);


  const handleSend = useCallback(() => {
    const body = text.trim();
    if (!body || disabled) return;
    onSend(body);
    setText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        background: COMPOSER_BG,
        borderTop: `0.5px solid ${HAIRLINE}`,
        paddingTop: 8,
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)`,
        paddingLeft: 12,
        paddingRight: 12,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        flexShrink: 0,
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
        transition: 'transform 120ms ease-out',
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Echo anything golf"
        rows={1}
        disabled={disabled}
        style={{
          flex: 1,
          minHeight: MIN_HEIGHT,
          maxHeight: MAX_HEIGHT,
          background: COMPOSER_INPUT_BG,
          borderRadius: 18,
          padding: '8px 14px',
          color: INK,
          fontSize: 14,
          lineHeight: `${LINE_HEIGHT}px`,
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
        }}
      />
      <button
        type="button"
        aria-label="Send"
        onClick={handleSend}
        disabled={!canSend}
        className={canSend ? 'active:opacity-80' : ''}
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: SEND_BG,
          border: 'none',
          color: SEND_FG,
          opacity: canSend ? 1 : 0.4,
          pointerEvents: canSend ? 'auto' : 'none',
          flexShrink: 0,
          alignSelf: 'flex-end',
          marginBottom: 1,
        }}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
};

export const ECHO_COMPOSER_PLACEHOLDER_COLOR = HINT;

export default EchoComposer;
