import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonalPodiumEntry } from '@/types/podium';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrophyPodiumSlotProps {
  entry: SeasonalPodiumEntry | undefined;
  position: 1 | 2 | 3;
  seasonThemeColor?: string;
  isCurrentUser?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

// Position-specific styling
const POSITION_CONFIG = {
  1: {
    imageSize: 88,
    borderWidth: 3,
    badgeSize: 28,
    platformHeight: 48,
    nameSize: 'text-base font-bold',
    countSize: 'text-xl',
    borderColor: '#eab308', // Gold
    badgeBg: 'bg-amber-500',
    badgeText: '',
    showCrown: true,
  },
  2: {
    imageSize: 72,
    borderWidth: 2,
    badgeSize: 24,
    platformHeight: 32,
    nameSize: 'text-sm font-semibold',
    countSize: 'text-lg',
    borderColor: '#94a3b8', // Silver
    badgeBg: 'bg-slate-400',
    badgeText: '2',
    showCrown: false,
  },
  3: {
    imageSize: 72,
    borderWidth: 2,
    badgeSize: 24,
    platformHeight: 24,
    nameSize: 'text-sm font-semibold',
    countSize: 'text-lg',
    borderColor: '#d97706', // Bronze
    badgeBg: 'bg-amber-600',
    badgeText: '3',
    showCrown: false,
  },
} as const;

/**
 * Truncate name to "First L." format
 */
function formatName(displayName: string | null, username: string | null): string {
  const name = displayName || username || 'Unknown';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].length > 12 ? parts[0].slice(0, 11) + '…' : parts[0];
  }
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  const formatted = `${firstName} ${lastInitial}.`;
  
  return formatted.length > 14 ? `${firstName.slice(0, 10)}… ${lastInitial}.` : formatted;
}

export const TrophyPodiumSlot: React.FC<TrophyPodiumSlotProps> = ({
  entry,
  position,
  seasonThemeColor = '#22c55e',
  isCurrentUser = false,
  onClick,
  animationDelay = 0,
}) => {
  const config = POSITION_CONFIG[position];

  // Empty slot placeholder
  if (!entry) {
    return (
      <div 
        className="flex flex-col items-center"
        style={{ width: position === 1 ? 120 : 100 }}
      >
        {/* Empty platform */}
        <div 
          className="w-full rounded-t-lg bg-muted/50"
          style={{ height: config.platformHeight }}
        />
      </div>
    );
  }

  const formattedName = formatName(entry.display_name, entry.username);
  const avatarFallback = entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?';

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center cursor-pointer relative',
        isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl'
      )}
      style={{ width: position === 1 ? 120 : 100 }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: animationDelay,
        ease: 'easeOut',
      }}
    >
      {/* Crown for 1st place */}
      {config.showCrown && (
        <motion.div
          className="mb-1"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: animationDelay + 0.2,
            duration: 0.4,
            type: 'spring',
            stiffness: 200,
          }}
        >
          <Crown 
            size={28} 
            className="drop-shadow-sm"
            style={{ color: seasonThemeColor }}
            fill={seasonThemeColor}
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Position badge (above image) */}
      {!config.showCrown && (
        <div
          className={cn(
            'mb-2 flex items-center justify-center font-bold text-white rounded-full shadow-sm',
            config.badgeBg
          )}
          style={{
            width: config.badgeSize,
            height: config.badgeSize,
            fontSize: config.badgeSize * 0.5,
          }}
        >
          {config.badgeText}
        </div>
      )}

      {/* Profile image with glow (1st only) and metallic border */}
      <div className="relative">
        {/* Glow effect for 1st place */}
        {position === 1 && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{
              backgroundColor: seasonThemeColor,
              transform: 'scale(1.3)',
            }}
          />
        )}
        
        {/* Circular avatar with metallic border */}
        <div
          className="relative rounded-full overflow-hidden shadow-lg"
          style={{
            width: config.imageSize,
            height: config.imageSize,
            border: `${config.borderWidth}px solid ${config.borderColor}`,
          }}
        >
          {entry.avatar_url ? (
            <img
              src={entry.avatar_url}
              alt={formattedName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xl">
              {avatarFallback}
            </div>
          )}
        </div>

        {/* 1st place badge inside crown */}
        {position === 1 && (
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center font-bold text-white rounded-full shadow-md bg-amber-500"
            style={{
              width: config.badgeSize,
              height: config.badgeSize,
              fontSize: config.badgeSize * 0.5,
            }}
          >
            1
          </div>
        )}
      </div>

      {/* Name */}
      <p
        className={cn(
          'mt-2 text-center text-foreground leading-tight',
          config.nameSize
        )}
      >
        {formattedName}
      </p>

      {/* Course count */}
      <motion.p
        className={cn('font-bold', config.countSize)}
        style={{ color: position === 1 ? seasonThemeColor : config.borderColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
      >
        {entry.courses_logged}
        <span className="text-xs font-normal text-muted-foreground ml-1">courses</span>
      </motion.p>

      {/* Platform */}
      <div
        className="w-full mt-2 rounded-t-lg"
        style={{
          height: config.platformHeight,
          backgroundColor: position === 1 
            ? `${seasonThemeColor}26` // 15% opacity
            : 'rgba(0, 0, 0, 0.05)',
        }}
      />
    </motion.div>
  );
};
