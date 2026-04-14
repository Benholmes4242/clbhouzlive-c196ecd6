/**
 * Remove Review Action Sheet — Dispatch style
 * Flat rows with destructive red accent
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface RemoveReviewActionSheetProps {
  open: boolean;
  onRemove: () => void;
  onCancel: () => void;
  isRemoving?: boolean;
}

export function RemoveReviewActionSheet({
  open,
  onRemove,
  onCancel,
  isRemoving = false,
}: RemoveReviewActionSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={isRemoving ? undefined : onCancel}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0"
            style={{
              background: '#ffffff',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
            </div>

            <div style={{ padding: '6px 20px 14px' }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#EF4444', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Destructive Action</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Remove this review?</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>This will permanently delete your rating for this course.</div>
            </div>

            <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
              <button
                onClick={onCancel}
                disabled={isRemoving}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px', background: 'transparent', border: 'none',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer', textAlign: 'left' as const,
                  fontSize: 15, fontWeight: 700, color: '#0F172A',
                  opacity: isRemoving ? 0.5 : 1,
                }}
              >
                <span>←</span>
                <span>Keep my review</span>
              </button>
              <button
                onClick={onRemove}
                disabled={isRemoving}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px', background: 'transparent', border: 'none',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer', textAlign: 'left' as const,
                  fontSize: 15, fontWeight: 500, color: '#EF4444',
                  opacity: isRemoving ? 0.7 : 1,
                }}
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#EF4444' }} />
                ) : (
                  <span>🗑</span>
                )}
                <span>{isRemoving ? 'Removing…' : 'Yes, remove it'}</span>
              </button>
            </div>

            <div style={{ height: 8 }} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
