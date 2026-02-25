import React from 'react';
import { cn } from '@/lib/utils';
import { SeasonalPodiumEntry } from '@/types/podium';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNameTwoLines } from '@/utils/formatters';

interface TrophyPodiumSlotProps {
  entry: SeasonalPodiumEntry | undefined;
  position: 1 | 2 | 3;
  seasonThemeColor?: string;
  isCurrentUser?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

// Premium awards stage configuration — scaled up
const POSITION_CONFIG = {
  1: {
    avatarSize: 120,
    mobileAvatarSize: 120,
    borderWidth: 3,
    badgeSize: 26,
    nameClass: 'text-[17px] font-bold',
    statSize: 24,
    statWeight: 800,
    labelSize: 13,
    borderGradient: ['#D4A853', '#F0D78C', '#D4A853'],
    badgeBg: '#D4A853',
    shadowColor: 'rgba(212, 168, 83, 0.25)',
    crownSize: 36,
    verticalOffset: 0,
  },
  2: {
    avatarSize: 88,
    mobileAvatarSize: 88,
    borderWidth: 3,
    badgeSize: 22,
    nameClass: 'text-[15px] font-semibold',
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    borderGradient: ['#A8B4C0'],
    badgeBg: '#A8B4C0',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 24,
  },
  3: {
    avatarSize: 88,
    mobileAvatarSize: 88,
    borderWidth: 3,
    badgeSize: 22,
    nameClass: 'text-[15px] font-semibold',
    statSize: 20,
    statWeight: 700,
    labelSize: 12,
    borderGradient: ['#C4956A'],
    badgeBg: '#C4956A',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    crownSize: 0,
    verticalOffset: 40,
  },
} as const;

export const TrophyPodiumSlot: React.FC<TrophyPodiumSlotProps> = ({
  entry,
  position,
  seasonThemeColor = '#006747',
  isCurrentUser = false,
  onClick,
  animationDelay = 0,
}) => {
  const config = POSITION_CONFIG[position];

  if (!entry) {
    return (
      <div className="flex flex-col items-center flex-1" style={{ marginTop: config.verticalOffset }}>
        <div
          className="bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium"
          style={{ width: config.mobileAvatarSize, height: config.mobileAvatarSize, borderRadius: '50%' }}
        >
          ?
        </div>
      </div>
    );
  }

  const nameParts = formatNameTwoLines(entry.display_name, entry.username);
  const avatarFallback = entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?';
  const borderColor = config.borderGradient[0];

  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer relative flex-1"
      style={{ marginTop: config.verticalOffset }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: animationDelay,
        ease: 'easeOut',
      }}
    >
      {/* Crown for 1st place */}
      {position === 1 && (
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
            size={config.crownSize}
            className="drop-shadow-md"
            style={{ color: '#D4A853' }}
            fill="#D4A853"
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Avatar with metallic ring */}
      <div className="relative">
        {/* Golden glow for #1 */}
        {position === 1 && (
          <div
            className="absolute -z-10"
            style={{
              top: '-1.5rem',
              left: '-2rem',
              right: '-2rem',
              bottom: '-2rem',
              background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.3) 0%, rgba(212, 168, 83, 0.1) 50%, transparent 80%)',
              filter: 'blur(12px)',
            }}
          />
        )}

        {/* Avatar image */}
        <div
          className="relative overflow-hidden"
          style={{
            width: config.mobileAvatarSize,
            height: config.mobileAvatarSize,
            borderRadius: '50%',
            border: 'none',
            boxShadow: `0 ${position === 1 ? '8px 24px' : '4px 12px'} ${config.shadowColor}`,
          }}
        >
          {entry.avatar_url ? (
            <img
              src={entry.avatar_url}
              alt={nameParts.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xl">
              {avatarFallback}
            </div>
          )}
        </div>

        {/* Rank badge */}
        <div
          className="absolute -bottom-1.5 -right-0.5 flex items-center justify-center font-bold text-white shadow-md"
          style={{
            width: config.badgeSize,
            height: config.badgeSize,
            borderRadius: '50%',
            backgroundColor: config.badgeBg,
            border: '2px solid white',
            fontSize: config.badgeSize * 0.45,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          }}
        >
          {position}
        </div>
      </div>

      {/* Name */}
      <div className="mt-3 text-center">
        <p className={cn('text-foreground leading-tight', config.nameClass)}>
          {nameParts.firstName}
        </p>
        {nameParts.lastName && (
          <p className={cn('text-foreground leading-tight', config.nameClass)}>
            {nameParts.lastName}
          </p>
        )}
      </div>

      {/* Stat */}
      <motion.p
        className="font-bold mt-0.5"
        style={{ color: seasonThemeColor, fontSize: config.statSize, fontWeight: config.statWeight }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
      >
        {entry.courses_logged}
        <span className="font-normal text-muted-foreground ml-1" style={{ fontSize: config.labelSize }}>courses</span>
      </motion.p>
    </motion.div>
  );
};