import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SortMode = 'best' | 'newest';

interface CommentsHeaderProps {
  isDark: boolean;
  commentCount: number;
  onClose: () => void;
  sortMode?: SortMode;
  onSortChange?: (mode: SortMode) => void;
}

export const CommentsHeader: React.FC<CommentsHeaderProps> = ({
  isDark,
  commentCount,
  onClose,
  sortMode = 'newest',
  onSortChange,
}) => {
  return (
    <div
      className={cn(
        "relative z-10 flex-shrink-0 border-b",
        isDark ? "border-white/8" : "border-border/50"
      )}
      style={isDark ? {
        background: 'rgba(13, 13, 13, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } : undefined}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Title — left aligned */}
        <div className="flex items-baseline gap-1.5">
          {commentCount > 0 ? (
            <>
              <span className={cn(
                "text-[18px] font-bold tabular-nums",
                isDark ? "text-white" : "text-foreground"
              )}>
                {commentCount}
              </span>
              <span className={cn(
                "text-[14px] font-normal",
                isDark ? "text-white/55" : "text-muted-foreground"
              )}>
                {commentCount === 1 ? 'comment' : 'comments'}
              </span>
            </>
          ) : (
            <span className={cn(
              "text-[16px] font-semibold",
              isDark ? "text-white" : "text-foreground"
            )}>
              Comments
            </span>
          )}
        </div>

        {/* Sort + Close */}
        <div className="flex items-center gap-2">
          {/* Sort tabs */}
          {commentCount > 1 && onSortChange && (
            <div className={cn(
              "flex items-center rounded-full p-0.5",
              isDark ? "bg-white/8" : "bg-muted/60"
            )}>
              {(['best', 'newest'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSortChange(mode)}
                  className={cn(
                    "relative px-3 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-full transition-colors",
                    sortMode === mode
                      ? isDark
                        ? "text-white"
                        : "text-foreground"
                      : isDark
                        ? "text-white/40 hover:text-white/60"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sortMode === mode && (
                    <motion.div
                      layoutId="sort-indicator"
                      className={cn(
                        "absolute inset-0 rounded-full",
                        isDark ? "bg-white/12" : "bg-background shadow-sm"
                      )}
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    />
                  )}
                  <span className="relative z-10">
                    {mode === 'best' ? 'Best' : 'Newest'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isDark
                ? "bg-white/8 hover:bg-white/12 text-white/60"
                : "bg-muted/60 hover:bg-muted text-muted-foreground"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsHeader;
