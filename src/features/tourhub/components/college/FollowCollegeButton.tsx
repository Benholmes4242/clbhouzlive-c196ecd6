import { Heart } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsCollegeFollowed, useFollowCollegeMutations } from '../../hooks/useCollegeMovers';

interface FollowCollegeButtonProps {
  normalizedName: string;
  compact?: boolean;
}

export function FollowCollegeButton({ normalizedName, compact = false }: FollowCollegeButtonProps) {
  const { user } = useAuth();
  const isFollowed = useIsCollegeFollowed(user?.id, normalizedName);
  const { follow, unfollow } = useFollowCollegeMutations(user?.id);

  if (!user) return null;

  const handleToggle = () => {
    if (isFollowed) {
      unfollow.mutate(normalizedName);
    } else {
      follow.mutate(normalizedName);
    }
  };

  const isPending = follow.isPending || unfollow.isPending;

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="p-2 rounded-full transition-colors"
        style={{
          background: isFollowed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)',
        }}
      >
        <Heart
          className="w-5 h-5"
          fill={isFollowed ? 'rgb(239, 68, 68)' : 'none'}
          stroke={isFollowed ? 'rgb(239, 68, 68)' : 'rgba(255,255,255,0.7)'}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors"
      style={{
        borderColor: isFollowed ? 'rgba(239, 68, 68, 0.3)' : 'hsl(var(--border))',
        background: isFollowed ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
      }}
    >
      <Heart
        className="w-4 h-4"
        fill={isFollowed ? 'rgb(239, 68, 68)' : 'none'}
        stroke={isFollowed ? 'rgb(239, 68, 68)' : 'hsl(var(--muted-foreground))'}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isFollowed ? 'rgb(239, 68, 68)' : 'hsl(var(--muted-foreground))',
        }}
      >
        {isFollowed ? 'Following' : 'Follow'}
      </span>
    </button>
  );
}
