/**
 * Chrome — Phase 1 minimal: close, mute, author row (display only),
 * caption line. Carousel dots are read from the fsv2 store (never a
 * lagging external state — v1 defect 6).
 *
 * Phase 2 lands the like/comment/share/report/follow rail.
 */

import React from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

import { useSessionAudio } from '@/audio/sessionAudioStore';

import { FSV2 } from '../tokens';
import { useFsv2Store } from '../store/fsv2Store';

interface Props {
  onClose: () => void;
  mediaCount: number;
  authorName: string;
  authorAvatar: string | null;
  caption: string;
  courseName?: string | null;
  safeAreaTop: number;
}

export const Fsv2Chrome: React.FC<Props> = ({
  onClose,
  mediaCount,
  authorName,
  authorAvatar,
  caption,
  courseName,
  safeAreaTop,
}) => {
  const isMuted = useSessionAudio((s) => s.isMuted);
  const activePagerIdx = useFsv2Store((s) => s.activePagerIdx);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    useSessionAudio.getState().toggle();
  };

  return (
    <>
      {/* Top-left: close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: safeAreaTop + 8,
          left: 12,
          width: 44,
          height: 44,
          padding: 0,
          border: 'none',
          background: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: FSV2.INK,
          WebkitTapHighlightColor: 'transparent',
          zIndex: 3,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: FSV2.GLASS_BG,
            backdropFilter: FSV2.GLASS_BLUR,
            WebkitBackdropFilter: FSV2.GLASS_BLUR,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} strokeWidth={2} />
        </span>
      </button>

      {/* Top-right: mute */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        aria-pressed={!isMuted}
        style={{
          position: 'absolute',
          top: safeAreaTop + 8,
          right: 12,
          width: 44,
          height: 44,
          padding: 0,
          border: 'none',
          background: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: FSV2.INK,
          WebkitTapHighlightColor: 'transparent',
          zIndex: 3,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: FSV2.GLASS_BG,
            backdropFilter: FSV2.GLASS_BLUR,
            WebkitBackdropFilter: FSV2.GLASS_BLUR,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMuted
            ? <VolumeX size={18} strokeWidth={2} />
            : <Volume2 size={18} strokeWidth={2} />}
        </span>
      </button>

      {/* Bottom: author + caption */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          zIndex: 3,
          color: FSV2.INK,
          fontFamily: FSV2.FONT_FAMILY,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt=""
              width={34}
              height={34}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                objectFit: 'cover',
                background: 'rgba(255,255,255,0.08)',
              }}
            />
          ) : (
            <span
              aria-hidden
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
              }}
            />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {authorName}
            </div>
            {courseName ? (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  fontWeight: 500,
                  color: FSV2.INK_MUTE,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {courseName}
              </div>
            ) : null}
          </div>
        </div>
        {caption ? (
          <div
            style={{
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>

      {/* Carousel dots — read straight from the store. */}
      {mediaCount > 1 ? (
        <div
          style={{
            position: 'absolute',
            top: safeAreaTop + 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            gap: 5,
            zIndex: 3,
          }}
        >
          {Array.from({ length: mediaCount }).map((_, i) => (
            <span
              key={i}
              style={{
                width: i === activePagerIdx ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background:
                  i === activePagerIdx ? FSV2.INK : 'rgba(255,255,255,0.45)',
                transition: 'width 180ms ease, background 180ms ease',
              }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
};
