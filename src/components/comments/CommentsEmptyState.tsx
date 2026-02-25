import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_REACTIONS, triggerHaptic } from '@/components/comments/utils';

const EMPTY_COPY = [
  "Drop your take on this shot",
  "The fairway is open — say something",
  "Be the first to weigh in",
  "This post is waiting for your hot take",
  "Got thoughts? Drop them here",
];

interface CommentsEmptyStateProps {
  isDark: boolean;
  onQuickReact: (emoji: string) => void;
}

export const CommentsEmptyState: React.FC<CommentsEmptyStateProps> = ({ isDark, onQuickReact }) => {
  const subtitle = useMemo(
    () => EMPTY_COPY[Math.floor(Math.random() * EMPTY_COPY.length)],
    []
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Icon — bounces in */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0 }}
        className="relative mb-5"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl",
            isDark ? "bg-primary/15" : "bg-primary/10"
          )}
        />
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
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

      {/* Title — fades up */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' }}
        className={cn(
          "text-lg font-semibold mb-1",
          isDark ? "text-white" : "text-foreground"
        )}
      >
        Start the conversation
      </motion.h3>

      {/* Subtitle — fades up */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }}
        className={cn(
          "text-sm mb-6",
          isDark ? "text-white/50" : "text-muted-foreground"
        )}
      >
        {subtitle}
      </motion.p>

      {/* Quick react emojis — stagger in with bounce */}
      <div className="flex items-center gap-2.5">
        {QUICK_REACTIONS.map((emoji, i) => (
          <motion.button
            key={emoji}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              damping: 10,
              stiffness: 250,
              delay: 0.5 + i * 0.06,
            }}
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => {
              triggerHaptic('success');
              onQuickReact(emoji);
            }}
            className={cn(
              "w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-colors",
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
