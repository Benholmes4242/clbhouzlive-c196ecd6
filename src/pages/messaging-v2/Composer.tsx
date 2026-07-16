import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUp } from 'lucide-react';
import { useSendMessage } from '@/hooks/messaging/useSendMessage';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';


const INK = '#1F2428';
const SUB = '#8A9099';
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
  conversationId: string;
  disabled?: boolean;
  onHeightChange?: (heightPx: number) => void;
  onAfterSend?: () => void;
}

export const Composer: React.FC<Props> = ({
  conversationId,
  disabled,
  onHeightChange,
  onAfterSend,
}) => {
  const { t } = useTranslation('messaging');

  const { send, sendMedia } = useSendMessage(conversationId);
  const [picking, setPicking] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canSend = text.trim().length > 0 && !disabled;

  // Auto-grow textarea between MIN and MAX heights.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [text]);

  // Report full bar height so the thread pads its scroll area.
  useLayoutEffect(() => {
    if (!onHeightChange) return;
    const el = containerRef.current;
    if (!el) return;
    onHeightChange(el.getBoundingClientRect().height);
  }, [onHeightChange, text, keyboardHeight]);

  const handleSend = useCallback(() => {
    const body = text.trim();
    if (!body || disabled) return;
    // Clear immediately so the input is ready for the next message —
    // optimism handles the bubble.
    setText('');
    void send({ body });
    onAfterSend?.();
  }, [text, disabled, send, onAfterSend]);

  const handleAttach = useCallback(async () => {
    if (disabled || picking) return;
    setPicking(true);
    try {
      const picked = await pickMediaFiles({
        accept: 'image/*',
        multiple: true,
        maxFiles: 10,
      });
      if (!picked.length) return;
      const valid = await validateMediaFiles(picked);
      const images = valid.filter((f) => f.type.startsWith('image/'));
      for (const file of images) {
        void sendMedia({ file, kind: 'image' });
      }
      if (images.length > 0) onAfterSend?.();
    } catch (e) {
      console.warn('[composer] attach failed', e);
    } finally {
      setPicking(false);
    }
  }, [disabled, picking, sendMedia, onAfterSend]);

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
        // Dock above the keyboard.
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
        transition: 'transform 120ms ease-out',
      }}
    >
      <button
        type="button"
        aria-label={t('a11y.attachImage')}
        onClick={handleAttach}
        disabled={disabled || picking}
        className="active:opacity-60"
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: SUB,
          flexShrink: 0,
        }}
      >
        <Plus size={22} />
      </button>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('composer.placeholder')}
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
        aria-label={t('a11y.send')}
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

// Placeholder colour export to keep tree-shakers happy if imported elsewhere.
export const COMPOSER_PLACEHOLDER_COLOR = HINT;

export default Composer;
