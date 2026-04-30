// CinematicHero — single-tile 4:5 cover hero with overlay controls and a
// rotated "pile" of non-cover thumbs that opens the ManageMediaSheet.
// Replaces the horizontal carousel.

import React, { useState } from 'react';
import { Pencil, Star, Play, Trash2, Plus } from 'lucide-react';
import type { StudioMediaItem } from '../types';
import { ManageMediaSheet } from './ManageMediaSheet';
import { ConfirmRemoveSheet } from './ConfirmRemoveSheet';

interface CinematicHeroProps {
  mediaItems: StudioMediaItem[];
  coverMediaId: string | null;
  taggedCourseName?: string;
  onSetCover: (mediaId: string) => void;
  onRemove: (mediaId: string) => void;
  onEdit: (mediaId: string) => void;
  onAddMore: () => void;
}

const FONT_STACK =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function previewSrc(item: StudioMediaItem): string {
  if (item.mediaType === 'video') return item.thumbnailUrl || '';
  return item.thumbnailUrl || item.previewUrl;
}

export function CinematicHero({
  mediaItems,
  coverMediaId,
  taggedCourseName,
  onSetCover,
  onRemove,
  onEdit,
  onAddMore,
}: CinematicHeroProps) {
  const [pileOpen, setPileOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const cover =
    mediaItems.find((m) => m.id === coverMediaId) || mediaItems[0];
  const others = mediaItems.filter((m) => m.id !== cover?.id);
  const otherCount = others.length;

  if (!cover) return null;

  const coverSrc = previewSrc(cover);
  const isVideo = cover.mediaType === 'video';

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          borderRadius: 18,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#111' }} />
        )}

        {/* Top + bottom gradients for legibility */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 96,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* COVER badge top-left */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 7,
            padding: '4px 8px',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          <Star style={{ width: 9, height: 9 }} fill="#fff" stroke="none" />
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.6,
              color: '#fff',
              textTransform: 'uppercase',
            }}
          >
            Cover
          </span>
        </div>

        {/* EDIT + REMOVE top-right */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 4,
          }}
        >
          <button
            onClick={() => onEdit(cover.id)}
            className="active:scale-[0.96] transition-transform"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(10px)',
              padding: '6px 11px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: FONT_STACK,
            }}
            aria-label="Edit cover"
          >
            <Pencil style={{ width: 12, height: 12 }} strokeWidth={2} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.2 }}>Edit</span>
          </button>

          <button
            onClick={() => setConfirmRemove(true)}
            className="active:scale-[0.96] transition-transform"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Remove from post"
          >
            <Trash2 style={{ width: 14, height: 14 }} strokeWidth={2} />
          </button>
        </div>

        {/* Video play indicator + duration */}
        {isVideo && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                <Play
                  className="text-white"
                  style={{ width: 24, height: 24, marginLeft: 2 }}
                  fill="white"
                  strokeWidth={0}
                />
              </div>
            </div>
            {cover.duration != null && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 56,
                  background: 'rgba(0,0,0,0.55)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 6,
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                {formatDuration(cover.duration)}
              </div>
            )}
          </>
        )}

        {/* Course chip bottom-left */}
        {taggedCourseName && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              padding: '6px 10px',
              maxWidth: 'calc(100% - 120px)',
              zIndex: 3,
            }}
          >
            <span style={{ fontSize: 12 }}>⛳</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {taggedCourseName}
            </span>
          </div>
        )}

        {/* Pile bottom-right */}
        {otherCount > 0 && (
          <button
            onClick={() => setPileOpen(true)}
            className="active:scale-[0.96] transition-transform"
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              zIndex: 3,
            }}
            aria-label={`Manage ${otherCount} other photo${otherCount > 1 ? 's' : ''}`}
          >
            <PileVisual others={others} otherCount={otherCount} />
          </button>
        )}
      </div>

      {/* Page indicator + add more */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 4px 0',
        }}
      >
        <button
          onClick={() => otherCount > 0 && setPileOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: otherCount > 0 ? 'pointer' : 'default',
            fontFamily: FONT_STACK,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,23,42,0.55)' }}>
            {mediaItems.length} {mediaItems.length === 1 ? 'photo' : 'photos'}
            {otherCount > 0 ? ' · tap to manage' : ''}
          </span>
        </button>

        <button
          onClick={onAddMore}
          className="active:scale-[0.96] transition-transform"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            cursor: 'pointer',
            color: '#0F172A',
            fontFamily: FONT_STACK,
          }}
        >
          <Plus style={{ width: 14, height: 14 }} strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>Add more</span>
        </button>
      </div>

      <ManageMediaSheet
        open={pileOpen}
        onClose={() => setPileOpen(false)}
        mediaItems={mediaItems}
        coverMediaId={coverMediaId}
        onSetCover={onSetCover}
        onRemove={onRemove}
      />

      <ConfirmRemoveSheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          onRemove(cover.id);
        }}
        isCover={true}
        hasOtherPhotos={otherCount > 0}
      />
    </div>
  );
}

function PileVisual({
  others,
  otherCount,
}: {
  others: StudioMediaItem[];
  otherCount: number;
}) {
  const visibleCount = Math.min(3, otherCount);
  const overflow = otherCount > 3;
  const slice = others.slice(0, visibleCount);

  return (
    <div
      style={{
        position: 'relative',
        width: 64,
        height: 56,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
    >
      {slice.map((item, i) => {
        const src = previewSrc(item);
        // Stack with rotation; topmost is the last one (rendered last)
        const rotations = [-8, 5, -3];
        const offsets = [0, 8, 16];
        const rot = rotations[i] ?? 0;
        const off = offsets[i] ?? 0;
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              right: off,
              bottom: 0,
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: 'hidden',
              transform: `rotate(${rot}deg)`,
              border: '2px solid #fff',
              boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
              background: '#000',
            }}
          >
            {src ? (
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#222' }} />
            )}
            {item.mediaType === 'video' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Play
                  className="text-white"
                  style={{ width: 12, height: 12 }}
                  fill="white"
                  strokeWidth={0}
                />
              </div>
            )}
          </div>
        );
      })}
      {overflow && (
        <div
          style={{
            position: 'absolute',
            right: -4,
            top: -4,
            minWidth: 22,
            height: 22,
            padding: '0 6px',
            borderRadius: 11,
            background: '#0F172A',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            border: '2px solid #fff',
            fontFamily: FONT_STACK,
          }}
        >
          +{otherCount - 3}
        </div>
      )}
    </div>
  );
}
