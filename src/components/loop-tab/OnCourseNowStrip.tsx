import { useNavigate } from 'react-router-dom';
import { useNetworkActivity, type NetworkFriend } from '@/hooks/useNetworkActivity';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface OnCourseNowStripProps {
  userId: string | undefined;
}

export function OnCourseNowStrip({ userId }: OnCourseNowStripProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNetworkActivity(userId);

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div
          className="flex items-center gap-2.5 px-4 pb-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-[58px] h-[58px] rounded-full bg-muted animate-pulse" />
              <div className="h-2.5 w-10 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const friends = data?.friends ?? [];
  if (friends.length === 0) return null;

  // Sort: active first, then others
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.is_active_recently && !b.is_active_recently) return -1;
    if (!a.is_active_recently && b.is_active_recently) return 1;
    return 0;
  });
  const visibleFriends = sortedFriends.slice(0, 8);

  const hasActiveFriends = visibleFriends.some((f) => f.is_active_recently);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between" style={{ padding: '12px 16px 6px' }}>
        <div className="flex items-center gap-1.5">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: hasActiveFriends ? '#22c55e' : 'hsl(var(--muted-foreground))',
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Recently active
          </span>
        </div>
        <button
          onClick={() => navigate('/golferstofollow')}
          className="active:scale-[0.97] transition-transform"
          style={{ fontSize: 13, fontWeight: 500, color: '#F7931E' }}
        >
          See all →
        </button>
      </div>

      {/* Stories strip */}
      <div
        className="flex items-start overflow-x-auto"
        style={{
          padding: '4px 16px 12px',
          gap: 10,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleFriends.map((friend) => (
          <StoryItem
            key={friend.id}
            friend={friend}
            onTap={() => navigate(`/profile/${friend.id}`)}
          />
        ))}
      </div>

      {/* Bottom divider */}
      <div
        style={{
          height: 0.5,
          background: 'hsl(var(--border) / 0.15)',
          margin: '0 16px',
        }}
      />
    </div>
  );
}

function StoryItem({ friend, onTap }: { friend: NetworkFriend; onTap: () => void }) {
  const isActive = friend.is_active_recently;
  const displayName = friend.display_name || friend.username || '?';

  return (
    <button
      onClick={onTap}
      className="flex flex-col items-center shrink-0 active:scale-[0.97] transition-transform"
      style={{ gap: 4 }}
    >
      {/* Ring */}
      <div
        className="relative"
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          border: `2.5px solid ${isActive ? '#F7931E' : 'hsl(var(--border))'}`,
          padding: 2,
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          <SquircleAvatar
            src={friend.profile_photo_url || '/placeholder.svg'}
            size="sm"
            hideRing
          />
        </div>
        {/* Green pulse dot */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 10,
              height: 10,
              background: '#22c55e',
              border: '2px solid #F8FAFC',
              borderRadius: '50%',
            }}
          />
        )}
      </div>
      {/* Name */}
      <span
        className="truncate text-center"
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: 'hsl(var(--muted-foreground))',
          maxWidth: 54,
        }}
      >
        {displayName}
      </span>
    </button>
  );
}
