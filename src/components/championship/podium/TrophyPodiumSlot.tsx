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

const POSITION_CONFIG = {
  1: {
    avatarSize: 120,
    mobileAvatarSize: 120,
    nameClass: 'text-[17px] font-bold',
    crownSize: 36,
    verticalOffset: 0,
    boxShadow: '0 8px 28px hsl(var(--accent-amber) / 0.25)',
    podiumHeight: 88,
    courseSize: 22,
    courseWeight: 900,
  },
  2: {
    avatarSize: 88,
    mobileAvatarSize: 88,
    nameClass: 'text-[15px] font-semibold',
    crownSize: 0,
    verticalOffset: 24,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    podiumHeight: 68,
    courseSize: 18,
    courseWeight: 700,
  },
  3: {
    avatarSize: 88,
    mobileAvatarSize: 88,
    nameClass: 'text-[15px] font-semibold',
    crownSize: 0,
    verticalOffset: 40,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    podiumHeight: 52,
    courseSize: 18,
    courseWeight: 700,
  },
} as const;

export const TrophyPodiumSlot: React.FC<TrophyPodiumSlotProps> = ({
  entry,
  position,
  seasonThemeColor = 'hsl(var(--accent-amber))',
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
      {/* YOU badge for current user */}
      {isCurrentUser && (
        <div
          className="mb-1 px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${seasonThemeColor}15`,
            border: `1px solid ${seasonThemeColor}40`,
          }}
        >
          <span className="text-[9px] font-bold uppercase" style={{ color: seasonThemeColor }}>
            YOU
          </span>
        </div>
      )}

      {/* Crown for 1st place */}
      {position === 1 && !isCurrentUser && (
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
            style={{ color: 'hsl(var(--accent-amber))' }}
            fill="#f59e0b"
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Avatar */}
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
              background: 'radial-gradient(ellipse at center, hsl(var(--accent-amber) / 0.3) 0%, hsl(var(--accent-amber) / 0.1) 50%, transparent 80%)',
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
            border: isCurrentUser ? `3px solid hsl(var(--accent-amber))` : 'none',
            boxShadow: config.boxShadow,
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
            width: position === 1 ? 26 : 22,
            height: position === 1 ? 26 : 22,
            borderRadius: '50%',
            backgroundColor: position === 1 ? 'hsl(var(--accent-amber))' : position === 2 ? '#A8B4C0' : '#C4956A',
            border: '2px solid hsl(var(--background))',
            fontSize: (position === 1 ? 26 : 22) * 0.45,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          }}
        >
          {position}
        </div>
      </div>

      {/* Podium base block */}
      <div
        className="w-full mt-2 flex flex-col items-center justify-center"
        style={{
          height: config.podiumHeight,
          borderRadius: '10px 10px 0 0',
          background: position === 1
            ? `linear-gradient(180deg, ${seasonThemeColor}20 0%, ${seasonThemeColor}08 100%)`
            : '#F8FAFC',
          borderTop: position === 1
            ? `2px solid ${seasonThemeColor}40`
            : '1px solid #E2E8F0',
        }}
      >
        {/* Name */}
        <p className={cn('text-foreground leading-tight text-center', config.nameClass)}>
          {nameParts.firstName}
        </p>
        {nameParts.lastName && (
          <p className={cn('text-foreground leading-tight text-center', config.nameClass)}>
            {nameParts.lastName}
          </p>
        )}

        {/* Course count — hero stat */}
        <motion.div
          className="text-center mt-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
        >
          <span
            className="font-black leading-none"
            style={{
              color: position === 1 ? seasonThemeColor : '#0F172A',
              fontSize: config.courseSize,
              fontWeight: config.courseWeight,
            }}
          >
            {entry.courses_logged}
          </span>
          <span className="text-[10px] text-muted-foreground ml-0.5 block">courses</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
