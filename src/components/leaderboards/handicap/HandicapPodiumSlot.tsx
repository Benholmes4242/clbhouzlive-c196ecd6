import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHcp, getHandicapStatusLabel } from '@/lib/formatHcp';
import { motion } from 'framer-motion';

interface HandicapPodiumSlotProps {
  rank: 1 | 2 | 3;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  handicap: number;
  isCurrentUser?: boolean;
  animationDelay?: number;
}

// Modern Country Club palette - exact match to TrophyPodiumSlot
const POSITION_CONFIG = {
  1: {
    ringSize: 130,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 32,
    platformHeight: 48,
    nameSize: 'text-base font-bold',
    handicapSize: 'text-xl',
    borderColor: '#C1A84C', // Golf Chartreus gold
    badgeBg: 'bg-[#C1A84C]',
    showCrown: true,
  },
  2: {
    ringSize: 104,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 28,
    platformHeight: 32,
    nameSize: 'text-sm font-semibold',
    handicapSize: 'text-lg',
    borderColor: '#B8C6C9', // Golf Sky Blue silver
    badgeBg: 'bg-[#B8C6C9]',
    showCrown: false,
  },
  3: {
    ringSize: 104,
    borderWidth: 1.5,
    gap: 0.5,
    badgeSize: 28,
    platformHeight: 24,
    nameSize: 'text-sm font-semibold',
    handicapSize: 'text-lg',
    borderColor: '#8B7355', // Warm bronze
    badgeBg: 'bg-[#8B7355]',
    showCrown: false,
  },
} as const;

const formatNameTwoLines = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

function getImageSize(ringSize: number, borderWidth: number, gap: number): number {
  return ringSize - (borderWidth * 2) - (gap * 2);
}

export function HandicapPodiumSlot({
  rank,
  userId,
  displayName,
  avatarUrl,
  handicap,
  isCurrentUser = false,
  animationDelay = 0,
}: HandicapPodiumSlotProps) {
  const config = POSITION_CONFIG[rank];
  const nameParts = formatNameTwoLines(displayName);
  const statusLabel = getHandicapStatusLabel(handicap);
  const imageSize = getImageSize(config.ringSize, config.borderWidth, config.gap);
  
  const initials = displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer relative flex-1"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        duration: 0.3,
        delay: animationDelay,
        ease: 'easeOut',
      }}
    >
      <Link
        to={`/profile/${userId}`}
        className="flex flex-col items-center"
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
              style={{ color: '#C1A84C' }}
              fill="#C1A84C"
              strokeWidth={1.5}
            />
          </motion.div>
        )}

        {/* Position badge (above image for 2nd/3rd) */}
        {!config.showCrown && (
          <div
            className={cn(
              'mb-2 flex items-center justify-center font-bold text-white shadow-sm',
              config.badgeBg
            )}
            style={{
              width: config.badgeSize,
              height: config.badgeSize * 1.05,
              borderRadius: '34%',
              fontSize: config.badgeSize * 0.5,
            }}
          >
            {rank}
          </div>
        )}

        {/* Avatar with ring */}
        <div className="relative">
          {/* Radial glow for 1st place */}
          {rank === 1 && (
            <div 
              className="absolute -z-10"
              style={{
                top: '-1rem',
                left: '-2.5rem',
                right: '-2.5rem',
                bottom: '-2.5rem',
                background: 'radial-gradient(ellipse at center, rgba(193, 168, 76, 0.6) 0%, rgba(193, 168, 76, 0.35) 30%, rgba(193, 168, 76, 0.1) 60%, transparent 80%)',
                filter: 'blur(16px)',
              }}
            />
          )}
          
          {/* Squircle avatar with box-shadow for ring + gap effect */}
          <div
            className="relative overflow-hidden"
            style={{
              width: imageSize,
              height: imageSize * 1.05,
              borderRadius: '34%',
              boxShadow: `0 0 0 ${config.gap}px hsl(var(--background)), 0 0 0 ${config.gap + config.borderWidth}px ${config.borderColor}`,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xl">
                {initials}
              </div>
            )}
          </div>

          {/* 1st place badge */}
          {rank === 1 && (
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center font-bold text-white shadow-md"
              style={{
                width: config.badgeSize,
                height: config.badgeSize * 1.05,
                borderRadius: '34%',
                fontSize: config.badgeSize * 0.5,
                backgroundColor: '#C1A84C',
              }}
            >
              1
            </div>
          )}
        </div>

        {/* Name - Two lines */}
        <div className="mt-2 text-center">
          <p className={cn('text-foreground leading-tight', config.nameSize)}>
            {nameParts.firstName}
          </p>
          {nameParts.lastName && (
            <p className={cn('text-foreground leading-tight', config.nameSize)}>
              {nameParts.lastName}
            </p>
          )}
        </div>

        {/* Handicap value */}
        <motion.p
          className={cn('font-bold', config.handicapSize)}
          style={{ color: config.borderColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
        >
          {formatHcp(handicap)}
        </motion.p>

        {/* Status label */}
        {statusLabel && (
          <div
            className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
            style={{
              backgroundColor: `${config.borderColor}15`,
              color: config.borderColor,
            }}
          >
            {statusLabel}
          </div>
        )}

        {/* Current user indicator */}
        {isCurrentUser && (
          <div className="text-[10px] text-[#C1A84C] font-medium mt-1">
            You
          </div>
        )}
      </Link>

      {/* Platform bar - exact heights from Championship */}
      <div
        className="w-full max-w-[130px] mt-2 rounded-t-lg"
        style={{
          height: config.platformHeight,
          backgroundColor: rank === 1 
            ? 'rgba(193, 168, 76, 0.15)'
            : 'rgba(0, 0, 0, 0.05)',
        }}
      />
    </motion.div>
  );
}
