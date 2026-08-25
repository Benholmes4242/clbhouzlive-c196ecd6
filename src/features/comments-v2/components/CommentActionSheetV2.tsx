/**
 * CommentActionSheetV2 — bottom sheet with actions for a comment.
 * Own comment: Edit / Copy / Delete
 * Other:       Copy / Report / Hide / Block-style close
 */
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Flag, EyeOff, Pencil, Trash2 } from 'lucide-react';

/* Dark baseline (MICRO_BRIEF_COMMENTS_DARK §2). Destructive red is the
   shipped dark danger value, not the light #B42318. */
const INK = '#F8FAFC';
const HAIRLINE = 'rgba(255,255,255,0.10)';
const DANGER = '#FF5A5A';
const ICON = 'rgba(248,250,252,0.62)';

interface Props {
  open: boolean;
  onClose: () => void;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  onHide?: () => void;
}

export function CommentActionSheetV2({
  open, onClose, isOwn, onEdit, onDelete, onCopy, onReport, onHide,
}: Props) {
  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[12004] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 right-0 bottom-0 z-[12005] mx-auto"
            style={{
              maxWidth: 560, background: '#1B1E27',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            }}
          >
            <div className="flex justify-center pt-2.5 pb-2">
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
            </div>

            {isOwn ? (
              <>
                <Row icon={<Pencil size={18} />} label="Edit comment" onClick={() => { onEdit?.(); onClose(); }} />
                <Divider />
                <Row icon={<Copy size={18} />} label="Copy text" onClick={() => { onCopy?.(); onClose(); }} />
                <Divider />
                <Row icon={<Trash2 size={18} />} label="Delete comment" destructive onClick={() => { onDelete?.(); onClose(); }} />
              </>
            ) : (
              <>
                <Row icon={<Copy size={18} />} label="Copy text" onClick={() => { onCopy?.(); onClose(); }} />
                <Divider />
                <Row icon={<EyeOff size={18} />} label="Hide comment" onClick={() => { onHide?.(); onClose(); }} />
                <Divider />
                <Row icon={<Flag size={18} />} label="Report" onClick={() => { onReport?.(); onClose(); }} />
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-1 py-4 bg-transparent border-0 cursor-pointer"
              style={{ fontSize: 13, fontWeight: 600, color: INK, textTransform: 'uppercase', letterSpacing: '0.10em' }}
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}

function Row({
  icon, label, onClick, destructive,
}: { icon: React.ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 bg-transparent border-0 cursor-pointer text-left"
      style={{ color: destructive ? DANGER : INK, fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.10em' }}
    >
      <span style={{ color: destructive ? DANGER : ICON }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="mx-4" style={{ height: 1, background: HAIRLINE }} />;
}

export default CommentActionSheetV2;
