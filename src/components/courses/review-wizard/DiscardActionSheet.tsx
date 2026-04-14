/**
 * Discard Action Sheet — Dispatch style
 * Flat rows with amber accent, no frosted glass cards
 */

import { motion, AnimatePresence } from 'framer-motion';

interface DiscardActionSheetProps {
  open: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
  isEditMode?: boolean;
}

export function DiscardActionSheet({
  open,
  onDiscard,
  onKeepEditing,
  isEditMode = false,
}: DiscardActionSheetProps) {
  const title = isEditMode ? 'Exit without saving?' : 'Discard this review?';
  const subtitle = isEditMode ? 'Your changes will not be saved.' : "Your progress won't be saved";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={onKeepEditing}
          />
          {/* Sheet */}
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
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.12)' }} />
            </div>

            {/* Header */}
            <div style={{ padding: '6px 20px 14px' }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Review Wizard</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>{title}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{subtitle}</div>
            </div>

            {/* Rows */}
            <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
              <button
                onClick={onKeepEditing}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px', background: 'transparent', border: 'none',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer', textAlign: 'left' as const,
                  fontSize: 15, fontWeight: 700, color: '#0F172A',
                }}
              >
                <span>✏️</span>
                <span>Keep editing</span>
              </button>
              <button
                onClick={onDiscard}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 20px', background: 'transparent', border: 'none',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                  cursor: 'pointer', textAlign: 'left' as const,
                  fontSize: 15, fontWeight: 500, color: '#EF4444',
                }}
              >
                <span>🗑</span>
                <span>{isEditMode ? 'Exit without saving' : 'Discard review'}</span>
              </button>
            </div>

            <div style={{ height: 8 }} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
