/**
 * MediaTray — horizontal strip of thumbnails + add button.
 * Enforces the 10-item ceiling and shows per-item status.
 */

import React, { useRef } from 'react';
import { Plus, X, Play, RotateCcw, AlertCircle } from 'lucide-react';
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

  const remaining = REVIEW_V2_LIMITS.MAX_MEDIA - items.length;
  const canAdd = remaining > 0 && !disabled;

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
              <video
                src={it.previewUrl}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {it.type === 'video' && (
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

            {(it.status === 'uploading' || it.status === 'pending') && (
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
                <span style={{ fontSize: 9, fontWeight: 700 }}>Retry</span>
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

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Add photo or video"
            style={{
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
            }}
          >
            <Plus size={20} strokeWidth={2} />
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Add
            </span>
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
            fontSize: 12.5,
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
