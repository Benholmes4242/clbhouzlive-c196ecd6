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
  children: React.ReactNode;
}

/**
 * LeaderboardRow - Matches Championship tab styling exactly:
 * - MedalBadge for ranks (filled amber circles for top 3)
 * - 2-line layout (name, then courses · club)
 * - Large primary-colored stat on the right
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
        'w-full py-3 flex items-center gap-3 transition-colors transition-transform relative active:scale-[0.98]',
        isCurrentUser && 'bg-primary/5 pl-3 pr-4',
        !isCurrentUser && 'px-4',
        'hover:bg-muted/20 active:bg-muted/30'
      )}
    >
      {/* Left accent border for current user - Golf Chartreus */}
      {isCurrentUser && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#C1A84C]" />
      )}
      
      {/* Rank Badge - using Championship MedalBadge */}
      <MedalBadge rank={rank} size="md" />

      {/* Avatar */}
      <SquircleAvatar
        size={40}
        src={profilePhotoUrl}
        alt={displayName}
        fallback={initials}
        ringColor={ringColor}
      />

      {/* Name & Info - 3-line layout for Explore tab */}
      <div className="flex-1 min-w-0 text-left">
        {/* Line 1: Name */}
        <span className={cn(
          'text-sm font-medium truncate block',
          isCurrentUser && 'text-primary font-semibold'
        )}>
          {displayName}
        </span>
        
        {/* Line 2: Home Club */}
        {homeClub && (
          <span className="text-xs text-muted-foreground truncate block">
            {homeClub}
          </span>
        )}
        
        {/* Line 3: Courses count */}
        {coursesCount !== undefined && (
          <span className="text-xs text-muted-foreground block">
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
