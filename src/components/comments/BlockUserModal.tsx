import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/components/comments/utils';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isDark: boolean;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({ isOpen, onClose, onConfirm, userName, isDark }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className={cn(
        "absolute inset-0",
        isDark ? "bg-black/70" : "bg-black/50"
      )} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-sm rounded-[20px] overflow-hidden p-6",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        <h3 className={cn("text-[18px] font-semibold mb-2", isDark ? "text-white" : "text-foreground")}>
          Block {userName}?
        </h3>
        <p className={cn("text-[14px] mb-6", isDark ? "text-white/60" : "text-muted-foreground")}>
          They won't be able to see your posts or interact with you. You won't see their comments.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
              isDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              triggerHaptic('warning');
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-[12px] text-[15px] font-medium bg-red-500 text-white transition-colors hover:bg-red-600"
          >
            Block
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BlockUserModal;
