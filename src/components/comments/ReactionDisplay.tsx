import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GOLF_REACTIONS, GolfReactionType } from './GolfReactionPicker';

interface ReactionCount {
  type: GolfReactionType;
  count: number;
}

interface ReactionDisplayProps {
  reactions: ReactionCount[];
  userReactions: GolfReactionType[];
  onReactionClick?: (type: GolfReactionType) => void;
  size?: 'sm' | 'md';
  isDark?: boolean;
}

export function ReactionDisplay({
  reactions,
  userReactions,
  onReactionClick,
  size = 'sm',
  isDark = true,
}: ReactionDisplayProps) {
  // Filter to only show reactions with counts > 0
  const visibleReactions = reactions.filter(r => r.count > 0);
  
  if (visibleReactions.length === 0) return null;
  
  // Sort by count descending
  const sortedReactions = [...visibleReactions].sort((a, b) => b.count - a.count);
  
  // Get total count
  const totalCount = sortedReactions.reduce((sum, r) => sum + r.count, 0);
  
  return (
    <div className="flex items-center gap-1">
      {/* Emoji stack - show top 3 */}
      <div className="flex items-center -space-x-1">
        {sortedReactions.slice(0, 3).map((reaction, index) => {
          const reactionConfig = GOLF_REACTIONS.find(r => r.type === reaction.type);
          const isUserReaction = userReactions.includes(reaction.type);
          
          return (
            <motion.button
              key={reaction.type}
              onClick={() => onReactionClick?.(reaction.type)}
              className={cn(
                "flex items-center justify-center rounded-full border-2",
                size === 'sm' ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm",
                isDark 
                  ? "border-zinc-900 bg-zinc-800" 
                  : "border-white bg-gray-100",
                isUserReaction && "ring-1 ring-primary"
              )}
              style={{ zIndex: 3 - index }}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              {reactionConfig?.emoji}
            </motion.button>
          );
        })}
      </div>
      
      {/* Count */}
      {totalCount > 0 && (
        <span className={cn(
          "text-xs font-medium",
          isDark ? "text-white/60" : "text-muted-foreground"
        )}>
          {totalCount}
        </span>
      )}
    </div>
  );
}
