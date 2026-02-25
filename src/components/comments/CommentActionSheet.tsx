import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Flag, Ban, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isOwnComment: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  isPostAuthor?: boolean;
  isCaddiePick?: boolean;
  onSetCaddiePick?: () => void;
  onRemoveCaddiePick?: () => void;
}

export const CommentActionSheet: React.FC<CommentActionSheetProps> = ({
  isOpen,
  onClose,
  isDark,
  isOwnComment,
  onDelete,
  onEdit,
  onCopy,
  onReport,
  onBlock,
  isPostAuthor = false,
  isCaddiePick = false,
  onSetCaddiePick,
  onRemoveCaddiePick,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div className={cn(
        "absolute inset-0",
        isDark ? "bg-black/60" : "bg-black/40"
      )} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-md mx-4 mb-4 rounded-[20px] overflow-hidden",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        {/* Caddie's Pick options - for post authors only */}
        {isPostAuthor && !isOwnComment && (
          <>
            {!isCaddiePick ? (
              <button
                onClick={() => { onSetCaddiePick?.(); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
                )}
              >
                <span className="w-5 h-5 flex items-center justify-center text-base">🏌️</span>
                <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Set as Caddie's Pick</span>
              </button>
            ) : (
              <button
                onClick={() => { onRemoveCaddiePick?.(); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
                )}
              >
                <X className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
                <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Remove Caddie's Pick</span>
              </button>
            )}
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
          </>
        )}

        {isOwnComment ? (
          <>
            <button
              onClick={() => { onEdit?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Pencil className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Edit comment</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onCopy?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Copy className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Copy text</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onDelete?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                "text-destructive hover:bg-destructive/10"
              )}
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[15px]">Delete comment</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { onCopy?.(); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Copy className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Copy text</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onReport?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-muted/50"
              )}
            >
              <Flag className={cn("w-5 h-5", isDark ? "text-white/70" : "text-muted-foreground")} />
              <span className={cn("text-[15px]", isDark ? "text-white" : "text-foreground")}>Report</span>
            </button>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-border/50")} />
            <button
              onClick={() => { onBlock?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 transition-colors text-red-500 hover:bg-red-500/10"
              )}
            >
              <Ban className="w-5 h-5" />
              <span className="text-[15px]">Block user</span>
            </button>
          </>
        )}

        <div className={cn("h-2", isDark ? "bg-black/30" : "bg-muted/50")} />

        <button
          onClick={onClose}
          className={cn(
            "w-full py-4 text-[16px] font-medium transition-colors",
            isDark ? "text-white hover:bg-white/5" : "text-foreground hover:bg-muted/50"
          )}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

export default CommentActionSheet;
