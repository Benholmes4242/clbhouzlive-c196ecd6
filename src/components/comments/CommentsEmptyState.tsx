import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_REACTIONS, triggerHaptic } from '@/components/comments/utils';

interface CommentsEmptyStateProps {
  isDark: boolean;
  onQuickReact: (emoji: string) => void;
}

export const CommentsEmptyState: React.FC<CommentsEmptyStateProps> = ({ isDark, onQuickReact }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mb-4"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl",
            isDark ? "bg-primary/15" : "bg-primary/10"
          )}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className={cn(
            "relative w-16 h-16 rounded-full flex items-center justify-center",
            isDark
              ? "bg-gradient-to-br from-white/8 to-white/4 border border-white/8"
              : "bg-muted/50 border border-border/30"
          )}
        >
          <MessageCircle className={cn(
            "w-8 h-8",
            isDark ? "text-white/40" : "text-muted-foreground"
          )} />
        </motion.div>
      </motion.div>

      <h3 className={cn(
        "text-lg font-semibold mb-1",
        isDark ? "text-white" : "text-foreground"
      )}>
        Start the conversation
      </h3>

      <p className={cn(
        "text-sm mb-6",
        isDark ? "text-white/50" : "text-muted-foreground"
      )}>
        Be the first to share your thoughts
      </p>

      <div className="flex items-center gap-2">
        {QUICK_REACTIONS.map(emoji => (
          <motion.button
            key={emoji}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              triggerHaptic('success');
              onQuickReact(emoji);
            }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors",
              isDark
                ? "bg-white/5 hover:bg-white/10 border border-white/8"
                : "bg-muted/50 hover:bg-muted border border-border/30"
            )}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CommentsEmptyState;
