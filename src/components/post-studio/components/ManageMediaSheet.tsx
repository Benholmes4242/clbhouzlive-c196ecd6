// ManageMediaSheet — bottom sheet that opens from the cinematic hero pile.
// Renders all photos in a 3-column grid. Tap a thumb to set as cover; tap the
// trash icon to remove (no confirm in this management mode).

import React from 'react';
import { Star, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudioMediaItem } from '../types';

interface ManageMediaSheetProps {
  open: boolean;
  onClose: () => void;
  mediaItems: StudioMediaItem[];
  coverMediaId: string | null;
  onSetCover: (mediaId: string) => void;
  onRemove: (mediaId: string) => void;
}

const FONT_STACK =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function thumbSrc(item: StudioMediaItem): string {
  if (item.mediaType === 'video') return item.thumbnailUrl || '';
  return item.thumbnailUrl || item.previewUrl;
}

export function ManageMediaSheet({
  open,
  onClose,
  mediaItems,
  coverMediaId,
  onSetCover,
  onRemove,
}: ManageMediaSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1090,
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '85vh',
              background: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 1091,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              fontFamily: FONT_STACK,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(15,23,42,0.18)' }} />
            </div>

            <div style={{ padding: '6px 20px 12px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2 }}>
                All photos
              </div>
              <div style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', marginTop: 2 }}>
                Tap to set as cover
              </div>
            </div>

            <div
              style={{
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '4px 16px 16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                }}
              >
                {mediaItems.map((item) => {
                  const isCover = item.id === coverMediaId;
                  const src = thumbSrc(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSetCover(item.id);
                        onClose();
                      }}
                      style={{
                        position: 'relative',
                        aspectRatio: '1 / 1',
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: '#000',
                        border: isCover ? '2px solid #F7931E' : '2px solid transparent',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                      className="active:scale-[0.97] transition-transform"
                      aria-label={isCover ? 'Cover photo' : 'Set as cover'}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#111' }} />
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
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.55)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Play
                              className="text-white"
                              style={{ width: 13, height: 13, marginLeft: 1 }}
                              fill="white"
                              strokeWidth={0}
                            />
                          </div>
                        </div>
                      )}

                      {isCover && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(0,0,0,0.62)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: 6,
                            padding: '2px 5px',
                            pointerEvents: 'none',
                          }}
                        >
                          <Star style={{ width: 8, height: 8 }} fill="#fff" stroke="none" />
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 800,
                              letterSpacing: 0.6,
                              color: '#fff',
                              textTransform: 'uppercase',
                            }}
                          >
                            Cover
                          </span>
                        </div>
                      )}

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemove(item.id);
                          }
                        }}
                        aria-label="Remove from post"
                        style={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.65)',
                          border: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        className="active:scale-[0.92] transition-transform"
                      >
                        <Trash2 style={{ width: 12, height: 12, color: '#fff' }} strokeWidth={2} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
