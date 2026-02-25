import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHcp, getHandicapStatusLabel, getHandicapStatusColor, getHandicapBadgeStyle } from '@/lib/formatHcp';
import { motion } from 'framer-motion';

interface HandicapPodiumSlotProps {
  rank: 1 | 2 | 3;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  handicap: number;
  isCurrentUser?: boolean;
  animationDelay?: number;
  seasonColor?: string;
}

const POSITION_CONFIG = {
  1: {
    avatarSize: 120,
    borderWidth: 0.5,
    borderGradient: 'linear-gradient(135deg, #D4A853, #F0D78C, #D4A853)',
    badgeSize: 26,
    nameSize: 17,
    nameWeight: 700,
    statSize: 24,
    statWeight: 800,
    glowShadow: '0 8px 28px rgba(212, 168, 83, 0.25)',
    showCrown: true,
    verticalOffset: 0,
  },
  2: {
    avatarSize: 88,
    borderWidth: 0.5,
    borderGradient: '#A8B4C0',
    badgeSize: 22,
    nameSize: 15,
    nameWeight: 600,
    statSize: 20,
    statWeight: 700,
    glowShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    showCrown: false,
    verticalOffset: 24,
  },
  3: {
    avatarSize: 88,
    borderWidth: 0.5,
    borderGradient: '#C4956A',
    badgeSize: 22,
    nameSize: 15,
    nameWeight: 600,
    statSize: 20,
    statWeight: 700,
    glowShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    showCrown: false,
    verticalOffset: 40,
  },
} as const;

const BADGE_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#D4A853', text: 'white' },
  2: { bg: '#A8B4C0', text: 'white' },
  3: { bg: '#C4956A', text: 'white' },
};

const formatNameTwoLines = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

export function HandicapPodiumSlot({
  rank,
  userId,
  displayName,
  avatarUrl,
  handicap,
  isCurrentUser = false,
  animationDelay = 0,
  seasonColor,
}: HandicapPodiumSlotProps) {
  const config = POSITION_CONFIG[rank];
  const nameParts = formatNameTwoLines(displayName);
  const statusLabel = getHandicapStatusLabel(handicap);
  const badgeStyle = getHandicapBadgeStyle(handicap, seasonColor);
  const handicapColor = getHandicapStatusColor(handicap, seasonColor);
  const badge = BADGE_COLORS[rank];

  const initials = displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <motion.div
      className="flex flex-col items-center relative"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.4, delay: animationDelay, ease: 'easeOut' }}
      style={{ marginTop: config.verticalOffset }}
    >
      <Link to={`/profile/${userId}`} className="flex flex-col items-center">
        {/* Crown for 1st place */}
        {config.showCrown && (
          <motion.div
            className="mb-1"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: animationDelay + 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            <Crown
              size={36}
              style={{ color: '#D4A853', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              fill="#D4A853"
              strokeWidth={1.5}
            />
          </motion.div>
        )}

        {/* Avatar with ring — CIRCULAR */}
        <div className="relative">
          {/* Spotlight glow for #1 */}
          {rank === 1 && (
            <div
              className="absolute -inset-8 -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.06) 0%, transparent 70%)',
              }}
            />
          )}

          <div
            className="relative overflow-hidden"
            style={{
              width: config.avatarSize,
              height: config.avatarSize,
              borderRadius: '50%',
              border: rank === 1
                ? `${config.borderWidth}px solid transparent`
                : `${config.borderWidth}px solid ${config.borderGradient}`,
              backgroundImage: rank === 1
                ? `linear-gradient(var(--background), var(--background)), ${config.borderGradient}`
                : undefined,
              backgroundOrigin: rank === 1 ? 'border-box' : undefined,
              backgroundClip: rank === 1 ? 'padding-box, border-box' : undefined,
              boxShadow: config.glowShadow,
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xl">
                {initials}
              </div>
            )}
          </div>

          {/* Rank badge — circular */}
          <div
            className="absolute -bottom-1.5 -right-0.5 flex items-center justify-center font-bold shadow-md"
            style={{
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: '50%',
              background: badge.bg,
              color: badge.text,
              fontSize: rank === 1 ? 14 : 12,
              border: '2px solid white',
            }}
          >
            {rank}
          </div>
        </div>

        {/* Name */}
        <div className="mt-2.5 text-center max-w-[120px]">
          {/* "You" label — season colored */}
          {isCurrentUser && (
            <p className="text-xs font-medium mb-0.5" style={{ color: seasonColor || '#40916C' }}>You</p>
          )}
          <p
            className="text-foreground leading-tight"
            style={{ fontSize: config.nameSize, fontWeight: config.nameWeight }}
          >
            {nameParts.firstName}
          </p>
          {nameParts.lastName && (
            <p
              className="text-foreground leading-tight"
              style={{ fontSize: config.nameSize, fontWeight: config.nameWeight }}
            >
              {nameParts.lastName}
            </p>
          )}
        </div>

        {/* Handicap value — category colored */}
        <motion.p
          className="mt-1"
          style={{ color: handicapColor, fontSize: config.statSize, fontWeight: config.statWeight }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
        >
          {formatHcp(handicap)}
        </motion.p>

        {/* Handicap category badge */}
        {statusLabel && (
          <div
            className="text-xs font-semibold uppercase tracking-wide mt-1.5 rounded-lg"
            style={{
              background: badgeStyle.bg,
              color: badgeStyle.text,
              border: `1px solid ${badgeStyle.border}`,
              padding: '4px 10px',
            }}
          >
            {statusLabel}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
