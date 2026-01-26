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
  subtitle?: string | null;
  ringColor?: string | null;
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
  subtitle,
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
        'w-full px-4 py-3 flex items-center gap-3 transition-colors',
        isCurrentUser && 'bg-primary/5',
        'hover:bg-muted/20 active:bg-muted/30'
      )}
    >
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

      {/* Name & Info */}
      <div className="flex-1 min-w-0 text-left">
        <span className={cn(
          'text-sm font-medium truncate block',
          isCurrentUser && 'font-semibold'
        )}>
          {displayName}
          {isCurrentUser && <span className="ml-1 text-xs text-primary/70">(You)</span>}
        </span>
        {homeClub && (
          <span className="text-xs text-muted-foreground truncate block">{homeClub}</span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate block">{subtitle}</span>
        )}
      </div>

      {/* Stats (passed as children) */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {children}
      </div>
    </Link>
  );
}
