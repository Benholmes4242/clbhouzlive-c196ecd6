import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { UserRival } from '@/types/championship';

interface BeatRivalCTAProps {
  rival: UserRival;
  onLogCourse?: () => void;
  className?: string;
}

/**
 * BeatRivalCTA - Prominent call-to-action to beat closest rival.
 * Shows "Beat [Name] — Log a course" with urgency styling.
 */
export function BeatRivalCTA({ rival, onLogCourse, className }: BeatRivalCTAProps) {
  const firstName = rival.display_name.split(' ')[0];
  const initials = rival.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const gapAbs = Math.abs(rival.gap);
  const isBehind = rival.gap > 0;

  // Only show CTA if behind or tied
  if (!isBehind && rival.gap !== 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onLogCourse}
      className={cn(
        'w-full p-4 rounded-2xl',
        'bg-gradient-to-r from-amber-500 to-orange-500',
        'text-white shadow-lg shadow-orange-500/25',
        'flex items-center gap-3',
        'transition-all hover:shadow-xl hover:shadow-orange-500/30',
        className
      )}
    >
      {/* Rival avatar */}
      <div className="relative">
        <SquircleAvatar
          size={44}
          src={rival.avatar_url}
          alt={rival.display_name}
          fallback={initials}
        />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Zap className="w-3 h-3 text-amber-500" />
        </div>
      </div>

      {/* CTA text */}
      <div className="flex-1 text-left">
        <div className="font-bold text-base">
          Beat {firstName}
        </div>
        <div className="text-sm text-white/80">
          {gapAbs === 0 
            ? "You're tied — pull ahead!"
            : `${gapAbs} course${gapAbs !== 1 ? 's' : ''} behind — log a course`
          }
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-white/80" />
    </motion.button>
  );
}
