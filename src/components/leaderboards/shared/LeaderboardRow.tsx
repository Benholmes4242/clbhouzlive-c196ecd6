import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MedalBadge } from '@/components/championship/primitives';
import { cn } from '@/lib/utils';

interface LeaderboardRowProps {
  rank: number;
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  homeClub?: string | null;
  coursesCount?: number;
  ringColor?: string | null;
  isCurrentUser?: boolean;
  isFriend?: boolean;
  seasonColor?: string;
  children: React.ReactNode;
}

/**
 * LeaderboardRow — A* spec: 72px height, 48px squircle avatars, 16px/600 names
 */
export function LeaderboardRow({
  rank,
  userId,
  displayName,
  profilePhotoUrl,
  homeClub,
  coursesCount,
  ringColor,
  isCurrentUser = false,
  isFriend = false,
  seasonColor,
  children,
}: LeaderboardRowProps) {
  const initials = displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <Link
      to={`/profile/${userId}`}
      className={cn(
        'w-full py-4 flex items-center gap-3 transition-colors transition-transform active:scale-[0.98]',
        'px-4',
        'hover:bg-muted/20 active:bg-muted/30',
        isCurrentUser && 'rounded-xl'
      )}
      style={{
        borderBottom: isCurrentUser ? undefined : '1px solid hsl(var(--border) / 0.08)',
        ...(isCurrentUser ? {
          background: 'rgba(212, 168, 83, 0.08)',
          border: '2px solid rgba(212, 168, 83, 0.2)',
        } : {}),
      }}
    >
      
      {/* Rank Badge - using Championship MedalBadge */}
      <MedalBadge rank={rank} size="md" />

      {/* Avatar — 48px squircle */}
      <SquircleAvatar
        size={48}
        src={profilePhotoUrl}
        alt={displayName}
        fallback={initials}
        hideRing
      />

      {/* Name & Info */}
      <div className="flex-1 min-w-0 text-left">
        {/* Line 1: Name — 16px semibold */}
        <span className={cn(
          'text-base font-semibold truncate block',
          isCurrentUser && 'text-primary'
        )}>
          {displayName}
        </span>
        
        {/* Line 2: Home Club */}
        {homeClub && (
          <span className="text-[13px] text-muted-foreground truncate block">
            {homeClub}
          </span>
        )}
        
        {/* Line 3: Courses count */}
        {coursesCount !== undefined && (
          <span className="text-[13px] text-muted-foreground block">
            {coursesCount} courses
          </span>
        )}
      </div>

      {/* Stats (passed as children) */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {children}
      </div>
    </Link>
  );
}
