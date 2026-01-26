import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHcp, getHandicapStatusLabel } from '@/lib/formatHcp';

interface HandicapPodiumSlotProps {
  rank: 1 | 2 | 3;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  handicap: number;
  isCurrentUser?: boolean;
}

// Modern Country Club palette
const PODIUM_COLORS = {
  1: { ring: '#C1A84C', bg: 'rgba(193, 168, 76, 0.08)' }, // Chartreus Gold
  2: { ring: '#B8C6C9', bg: 'rgba(184, 198, 201, 0.08)' }, // Sky Blue Silver
  3: { ring: '#8B7355', bg: 'rgba(139, 115, 85, 0.08)' },  // Warm Bronze
};

const formatNameTwoLines = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

export function HandicapPodiumSlot({
  rank,
  userId,
  displayName,
  avatarUrl,
  handicap,
  isCurrentUser = false,
}: HandicapPodiumSlotProps) {
  const colors = PODIUM_COLORS[rank];
  const nameParts = formatNameTwoLines(displayName);
  const statusLabel = getHandicapStatusLabel(handicap);
  
  const initials = displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Size configurations
  const config = {
    1: { avatarSize: 72, width: 'w-28', nameSize: 'text-sm', handicapSize: 'text-2xl' },
    2: { avatarSize: 56, width: 'w-24', nameSize: 'text-xs', handicapSize: 'text-xl' },
    3: { avatarSize: 56, width: 'w-24', nameSize: 'text-xs', handicapSize: 'text-xl' },
  }[rank];

  return (
    <Link
      to={`/profile/${userId}`}
      className={cn(
        'flex flex-col items-center relative group',
        config.width
      )}
    >
      {/* Crown for 1st place */}
      {rank === 1 && (
        <div className="absolute -top-4 z-10">
          <Crown
            size={24}
            className="drop-shadow-md"
            style={{ color: '#C1A84C' }}
            fill="#C1A84C"
          />
        </div>
      )}

      {/* Avatar with ring */}
      <div className="relative mb-2">
        {/* Subtle glow for 1st place */}
        {rank === 1 && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-40"
            style={{
              background: `radial-gradient(circle, ${colors.ring} 0%, transparent 70%)`,
              transform: 'scale(1.5)',
            }}
          />
        )}
        
        <SquircleAvatar
          size={config.avatarSize}
          src={avatarUrl}
          alt={displayName}
          fallback={initials}
          ringColor={colors.ring}
        />
        
        {/* Rank badge */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: colors.ring }}
        >
          {rank}
        </div>
      </div>

      {/* Name */}
      <div className="text-center leading-tight mt-1">
        <p className={cn(config.nameSize, 'font-medium text-foreground truncate max-w-full')}>
          {nameParts.firstName}
        </p>
        {nameParts.lastName && (
          <p className={cn(config.nameSize, 'font-medium text-foreground truncate max-w-full')}>
            {nameParts.lastName}
          </p>
        )}
      </div>

      {/* Handicap value */}
      <div
        className={cn(config.handicapSize, 'font-bold mt-1.5')}
        style={{ color: colors.ring }}
      >
        {formatHcp(handicap)}
      </div>

      {/* Status label */}
      {statusLabel && (
        <div
          className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
          style={{
            backgroundColor: `${colors.ring}15`,
            color: colors.ring,
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
  );
}