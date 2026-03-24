import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatHcp, getHandicapStatusLabel, getHandicapBadgeStyle } from '@/lib/formatHcp';
import { motion } from 'framer-motion';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface HandicapPodiumSlotProps {
  rank: 1 | 2 | 3;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  handicap: number;
  isCurrentUser?: boolean;
  animationDelay?: number;
  mode?: 'lowest' | 'improved' | 'season';
}

const POSITION_CONFIG = {
  1: {
    avatarSize: 64,
    podiumHeight: 92,
    badgeSize: 18,
    showCrown: true,
  },
  2: {
    avatarSize: 52,
    podiumHeight: 72,
    badgeSize: 18,
    showCrown: false,
  },
  3: {
    avatarSize: 48,
    podiumHeight: 60,
    badgeSize: 18,
    showCrown: false,
  },
} as const;

const formatFirstName = (name: string) => name.trim().split(' ')[0];

export function HandicapPodiumSlot({
  rank,
  userId,
  displayName,
  avatarUrl,
  handicap,
  isCurrentUser = false,
  animationDelay = 0,
  mode = 'lowest',
}: HandicapPodiumSlotProps) {
  const config = POSITION_CONFIG[rank];
  const firstName = formatFirstName(displayName);
  const statusLabel = getHandicapStatusLabel(handicap);
  const badgeStyle = getHandicapBadgeStyle(handicap);

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
    >
      <Link to={`/profile/${userId}`} className="flex flex-col items-center">
        {/* "You" label */}
        {isCurrentUser && (
          <p
            className="font-bold uppercase mb-0.5"
            style={{ fontSize: 9, letterSpacing: '0.12em', color: '#F5A623' }}
          >
            You
          </p>
        )}

        {/* Crown emoji for 1st place */}
        {config.showCrown && !isCurrentUser && (
          <motion.span
            className="mb-1"
            style={{ fontSize: 20 }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: animationDelay + 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            👑
          </motion.span>
        )}

        {/* Avatar */}
        <div className="relative">
          <div
            className="overflow-hidden"
            style={{
              width: config.avatarSize,
              height: config.avatarSize,
              borderRadius: '50%',
              border: rank === 1 ? '2.5px solid #F5A623' : '1.5px solid rgba(0,0,0,0.07)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-semibold"
                style={{ background: '#F1F5F9', color: '#64748B', fontSize: config.avatarSize * 0.35 }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Rank badge */}
          <div
            className="absolute -bottom-1 -right-0.5 flex items-center justify-center font-extrabold text-white"
            style={{
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: '50%',
              backgroundColor: rank === 1 ? '#F5A623' : '#E2E8F0',
              color: rank === 1 ? 'white' : '#64748B',
              border: '1.5px solid white',
              fontSize: 9,
            }}
          >
            {rank}
          </div>
        </div>

        {/* Podium block */}
        <div
          className="flex flex-col items-center mt-1.5"
          style={{
            width: config.avatarSize + 24,
            height: config.podiumHeight,
            borderRadius: '10px 10px 0 0',
            padding: '8px 4px',
            background: rank === 1
              ? 'linear-gradient(180deg, rgba(245,166,35,0.13) 0%, rgba(245,166,35,0.07) 100%)'
              : '#F8FAFC',
            border: rank === 1
              ? '1px solid rgba(245,166,35,0.27)'
              : '1px solid rgba(0,0,0,0.07)',
            borderBottom: 'none',
          }}
        >
          {/* First name */}
          <p className="font-bold text-center truncate w-full" style={{ fontSize: 11, color: '#0F172A' }}>
            {firstName}
          </p>

          {/* Handicap value */}
          <motion.p
            className="font-bold"
            style={{
              fontSize: rank === 1 ? 18 : 15,
              color: rank === 1 ? '#F5A623' : '#0F172A',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
          >
            {formatHcp(handicap)}
          </motion.p>

          {/* Tier pill */}
          {statusLabel && (
            <span
              className="font-semibold uppercase tracking-wide text-center mt-0.5"
              style={{
                fontSize: 8,
                background: badgeStyle.bg,
                color: badgeStyle.text,
                borderRadius: 6,
                padding: '1px 5px',
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
