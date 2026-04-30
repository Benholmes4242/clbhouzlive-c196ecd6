// ConfirmRemoveSheet — small confirm bottom sheet for the cinematic hero's
// trash button. Copy adapts based on whether the user is removing the cover
// while other photos exist, or the only remaining photo.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmRemoveSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCover: boolean;
  hasOtherPhotos: boolean;
}

const FONT_STACK =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function ConfirmRemoveSheet({
  open,
  onClose,
  onConfirm,
  isCover,
  hasOtherPhotos,
}: ConfirmRemoveSheetProps) {
  const title = isCover && hasOtherPhotos ? 'Remove cover photo?' : 'Remove from post?';
  const body =
    isCover && hasOtherPhotos
      ? 'The next photo in your post will become the cover.'
      : 'This photo will be removed from your post. The original stays in your library.';

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
              zIndex: 1100,
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
              background: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 1101,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              fontFamily: FONT_STACK,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(15,23,42,0.18)' }} />
            </div>

            <div style={{ padding: '12px 20px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: -0.2 }}>
                {title}
              </div>
            </div>
            <div style={{ padding: '6px 24px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'rgba(15,23,42,0.62)' }}>
                {body}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
              <button
                onClick={onConfirm}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  border: 'none',
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT_STACK,
                }}
              >
                Remove
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 14,
                  border: '1px solid rgba(15,23,42,0.10)',
                  background: '#fff',
                  color: '#0F172A',
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONT_STACK,
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
