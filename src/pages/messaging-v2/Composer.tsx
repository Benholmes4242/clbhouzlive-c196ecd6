import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUp, X, Play } from 'lucide-react';
import { useSendMessage } from '@/hooks/messaging/useSendMessage';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';


/**
 * BRIEF_MESSAGES_ECHO_PALETTE §1 / §3 — the composer on Echo's palette. Flat
 * fill base, no chat chrome, and the send key carries AMBER because sending is
 * the viewing member acting (§6).
 */
const INK = '#F5F7F8';
const SUB = '#A8AFB4';
const HINT = '#7C8489';
const HAIRLINE = 'rgba(255,255,255,0.07)';
const COMPOSER_BG = '#0B0C0E';
const COMPOSER_INPUT_BG = 'rgba(255,255,255,0.08)';
const SEND_BG = '#F7931E';
const SEND_FG = '#151007';

const LINE_HEIGHT = 20;
const MAX_LINES = 5;
const MIN_HEIGHT = 36;
const MAX_HEIGHT = MIN_HEIGHT + LINE_HEIGHT * (MAX_LINES - 1);

interface Props {
  conversationId: string;
  disabled?: boolean;
  /**
   * Seeds the composer ONCE on mount (e.g. the handicap sync nudge). It is
   * fully editable and is never sent automatically. Deliberately not synced on
   * later renders, or the member could not delete the text.
   */
  initialText?: string;
  onHeightChange?: (heightPx: number) => void;
  onAfterSend?: () => void;
}

type PendingKind = 'image' | 'video';

interface PendingAttachment {
  id: string;
  file: File;
  kind: PendingKind;
  localPreviewUrl: string;
}

let pendingSeq = 0;
const nextPendingId = () => `pending-${Date.now()}-${++pendingSeq}`;

export const Composer: React.FC<Props> = ({
  conversationId,
  disabled,
  initialText,
  onHeightChange,
  onAfterSend,
}) => {
  const { t } = useTranslation('messaging');

  const { send, sendMedia } = useSendMessage(conversationId);
  const [picking, setPicking] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const [text, setText] = useState(initialText ?? '');
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Track URLs we've minted so we can revoke on unmount even after state clears.
  const mintedUrlsRef = useRef<Set<string>>(new Set());

  const hasPending = pending.length > 0;
  const hasText = text.trim().length > 0;
  const canSend = (hasText || hasPending) && !disabled;

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
  }, [onHeightChange, text, keyboardHeight, pending.length]);

  // Revoke any outstanding object URLs on unmount.
  useEffect(() => {
    return () => {
      for (const url of mintedUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* noop */
        }
      }
      mintedUrlsRef.current.clear();
    };
  }, []);

  const revoke = useCallback((url: string) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* noop */
    }
    mintedUrlsRef.current.delete(url);
  }, []);

  const removePending = useCallback(
    (id: string) => {
      setPending((prev) => {
        const next: PendingAttachment[] = [];
        for (const p of prev) {
          if (p.id === id) revoke(p.localPreviewUrl);
          else next.push(p);
        }
        return next;
      });
    },
    [revoke],
  );

  const handleSend = useCallback(() => {
    if (!canSend) return;
    const body = text.trim();
    const attachments = pending;
    // Clear immediately so the composer is ready — optimism handles bubbles.
    setText('');
    setPending([]);

    // Fire media in order; keep going on individual failures so the rest still send.
    (async () => {
      for (const att of attachments) {
        try {
          await sendMedia({ file: att.file, kind: 'image' });
        } catch (e) {
          console.warn('[composer] sendMedia failed', e);
        } finally {
          revoke(att.localPreviewUrl);
        }
      }
      if (body) {
        try {
          void send({ body });
        } catch (e) {
          console.warn('[composer] send text failed', e);
        }
      }
      onAfterSend?.();
    })();
  }, [canSend, text, pending, sendMedia, send, revoke, onAfterSend]);

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
      const staged: PendingAttachment[] = [];
      for (const file of valid) {
        const kind: PendingKind = file.type.startsWith('video/') ? 'video' : 'image';
        const url = URL.createObjectURL(file);
        mintedUrlsRef.current.add(url);
        staged.push({ id: nextPendingId(), file, kind, localPreviewUrl: url });
      }
      if (staged.length > 0) {
        setPending((prev) => [...prev, ...staged]);
      }
    } catch (e) {
      console.warn('[composer] attach failed', e);
    } finally {
      setPicking(false);
    }
  }, [disabled, picking]);

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
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
        // Dock above the keyboard.
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
        transition: 'transform 120ms ease-out',
      }}
    >
      {hasPending ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 2,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {pending.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'relative',
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: 'hidden',
                flexShrink: 0,
                background: COMPOSER_INPUT_BG,
              }}
            >
              <img
                src={p.localPreviewUrl}
                alt=""
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {p.kind === 'video' ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)',
                    color: '#FFFFFF',
                  }}
                >
                  <Play size={18} fill="#FFFFFF" />
                </div>
              ) : null}
              <button
                type="button"
                aria-label={t('a11y.removeAttachment', { defaultValue: 'Remove attachment' })}
                onClick={() => removePending(p.id)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
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
    </div>
  );
};

// Placeholder colour export to keep tree-shakers happy if imported elsewhere.
export const COMPOSER_PLACEHOLDER_COLOR = HINT;

export default Composer;
