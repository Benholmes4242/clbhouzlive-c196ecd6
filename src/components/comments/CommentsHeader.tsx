import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentsHeaderProps {
  isDark: boolean;
  commentCount: number;
  onClose: () => void;
}

export const CommentsHeader: React.FC<CommentsHeaderProps> = ({
  isDark,
  commentCount,
  onClose,
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
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "p-3 -ml-3 rounded-full transition-colors",
            isDark ? "hover:bg-white/10" : "hover:bg-muted/50"
          )}
        >
          <ChevronLeft className={cn(
            "w-5 h-5",
            isDark ? "text-white" : "text-foreground"
          )} />
        </button>

        <div className="flex flex-col items-center">
          <span className={cn(
            "font-semibold text-sm",
            isDark ? "text-white" : "text-foreground"
          )}>
            Comments
          </span>
          <span className={cn(
            "text-xs",
            isDark ? "text-white/50" : "text-muted-foreground"
          )}>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-9" />
      </div>
    </div>
  );
};

export default CommentsHeader;
