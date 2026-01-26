import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';

interface LeaderboardRowProps {
  rank: number;
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  homeClub?: string | null;
  isCurrentUser?: boolean;
  isFriend?: boolean;
  children: React.ReactNode;
}

export function LeaderboardRow({
  rank,
  userId,
  displayName,
  profilePhotoUrl,
  homeClub,
  isCurrentUser = false,
  isFriend = false,
  children,
}: LeaderboardRowProps) {
  const getRankStyle = () => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
    if (rank === 2) return 'bg-gray-300/20 text-gray-600 dark:text-gray-300';
    if (rank === 3) return 'bg-amber-600/20 text-amber-700 dark:text-amber-400';
    return 'bg-muted text-muted-foreground';
  };

  const initials = displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors',
        isCurrentUser && 'bg-primary/[0.06]',
        !isCurrentUser && 'hover:bg-muted/30'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
          getRankStyle()
        )}
      >
        {rank}
      </div>

      {/* Avatar + Name */}
      <Link to={`/profile/${userId}`} className="flex items-center gap-3 flex-1 min-w-0">
        <SquircleAvatar
          size={44}
          src={profilePhotoUrl}
          alt={displayName}
          fallback={initials}
        />
        <div className="flex flex-col min-w-0">
          <span className={cn(
            'text-sm font-medium truncate',
            isCurrentUser && 'font-semibold'
          )}>
            {displayName}
            {isCurrentUser && <span className="ml-1 text-xs text-primary/70">(You)</span>}
          </span>
          {homeClub && (
            <span className="text-xs text-muted-foreground truncate">{homeClub}</span>
          )}
        </div>
      </Link>

      {/* Stats (passed as children) */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {children}
      </div>
    </div>
  );
}
