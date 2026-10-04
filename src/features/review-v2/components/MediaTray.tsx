/**
 * MediaTray — horizontal strip of thumbnails + add button.
 * Enforces the 10-item ceiling and shows per-item status.
 */

import React, { useRef } from 'react';
import { Plus, X, Play, Loader2, RotateCcw, AlertCircle, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RV2, REVIEW_V2_LIMITS } from '../tokens';
import type { MediaItem } from '../types';

interface Props {
  items: MediaItem[];
  onPick: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  pickerError?: string | null;
  onClearError?: () => void;
  disabled?: boolean;
}

export function MediaTray({
  items,
  onPick,
  onRemove,
  onRetry,
  pickerError,
  onClearError,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation('courses');

  const remaining = REVIEW_V2_LIMITS.MAX_MEDIA - items.length;
  const canAdd = remaining > 0 && !disabled;
  /** Decides the add control's presentation — the only switch. */
  const empty = items.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
          scrollbarWidth: 'none',
        }}
      >
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              position: 'relative',
              width: 72,
              height: 72,
              borderRadius: 12,
              overflow: 'hidden',
              background: RV2.ghost,
              flexShrink: 0,
              border: `1px solid ${RV2.hairline}`,
            }}
          >
            {it.type === 'image' ? (
              <img
                src={it.previewUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : it.posterUrl ? (
              <img
                src={it.posterUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              /* THE #t=0.1 MEDIA FRAGMENT IS WHAT MAKES THE FRAME APPEAR. A
                 <video> that is never played and never seeked decodes nothing and
                 paints black — metadata gives dimensions and duration, not a
                 picture. The fragment tells the browser to position at 0.1s, so
                 loading metadata also decodes that frame. Same pattern as
                 PendingPostCard.tsx, which fixed this once already. 0.1 rather
                 than 0 because a seek to exactly 0 is a no-op in some decoders
                 and leaves the element unpainted. */
              <video
                src={`${it.previewUrl}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {it.type === 'video' && !it.analysing && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)',
                }}
              >
                <Play size={16} color={RV2.onDark} fill={RV2.onDark} />
              </div>
            )}

            {!it.analysing && (it.status === 'uploading' || it.status === 'pending') && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 3,
                  background: 'rgba(255,255,255,0.35)',
                }}
              >
                <div
                  style={{
                    width: `${it.progress ?? 0}%`,
                    height: '100%',
                    background: RV2.amber,
                    transition: 'width 200ms',
                  }}
                />
              </div>
            )}

            {it.analysing && (
              <div
                aria-label="Preparing"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'grid',
                  placeItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Loader2 size={20} color={RV2.onDark} className="motion-safe:animate-spin" />
              </div>
            )}

            {it.status === 'failed' && (
              <button
                type="button"
                onClick={() => onRetry?.(it.id)}
                aria-label="Retry upload"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  color: RV2.onDark,
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} />
                <span style={{ /* CAPS ACTION (§5), floor 11. */ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Retry</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onRemove(it.id)}
              aria-label="Remove"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.6)',
                color: RV2.onDark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* ONE add control, two presentations: while the tray is empty it is a
            full-width row (an empty strip is a strip of nothing, so the width is
            free — ~5x the tap area at the same 72px height); from the first item
            on it is the 72px square at the end of the strip. Same onClick, same
            hidden input, same aria-label. */}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Add photo or video"
            style={
              empty
                ? {
                    width: '100%',
                    borderRadius: 14,
                    border: `1.5px dashed ${RV2.hairlineStrong}`,
                    background: RV2.ghost,
                    padding: '15px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }
                : {
                    width: 72,
                    height: 72,
                    flexShrink: 0,
                    borderRadius: 12,
                    border: `1.5px dashed ${RV2.hairlineStrong}`,
                    background: RV2.ghost,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    color: RV2.secondary,
                    cursor: 'pointer',
                  }
            }
          >
            {empty ? (
              <>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    flex: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(255,255,255,0.07)',
                    color: RV2.ink,
                  }}
                >
                  <Camera size={20} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: RV2.ink }}>
                    {t('review.wizard.step2.mediaEmptyTitle')}
                  </span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: RV2.secondary }}>
                    {t('review.wizard.step2.mediaEmptySub', { count: REVIEW_V2_LIMITS.MAX_MEDIA })}
                  </span>
                </span>
              </>
            ) : (
              <>
                <Plus size={20} strokeWidth={2} />
                <span style={{ /* CAPS ACTION (§5), floor 11. */ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  Add
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {pickerError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            background: 'rgba(247,147,30,0.08)',
            border: `1px solid ${RV2.hairline}`,
            borderRadius: 10,
            color: RV2.ink,
            fontSize: 13,
          }}
        >
          <AlertCircle size={14} color={RV2.amber} />
          <span style={{ flex: 1 }}>{pickerError}</span>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                border: 'none',
                color: RV2.secondary,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onPick(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
