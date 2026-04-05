import { useNavigate } from 'react-router-dom';
import { useNetworkActivity, type NetworkFriend } from '@/hooks/useNetworkActivity';

interface OnCourseNowStripProps {
  userId: string | undefined;
}

export function OnCourseNowStrip({ userId }: OnCourseNowStripProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNetworkActivity(userId);

  // Loading skeleton
  if (isLoading) {
    return (
      <div style={{ borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
        <div className="flex items-center justify-between px-4 pt-3.5 pb-1.5">
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
              <div className="w-[68px] h-[68px] bg-muted animate-pulse" style={{ borderRadius: '34%' }} />
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
    <div style={{ borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
      {/* Section header */}
      <div className="flex items-center justify-between" style={{ padding: '14px 16px 6px' }}>
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
          padding: '4px 16px 14px',
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
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

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
          width: 68,
          height: 68,
          borderRadius: '34%',
          border: `2.5px solid ${isActive ? '#F7931E' : 'hsl(var(--border))'}`,
        }}
      >
        <div className="w-full h-full overflow-hidden" style={{ borderRadius: '32%' }}>
          {friend.profile_photo_url ? (
            <img
              src={friend.profile_photo_url}
              alt={displayName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm font-semibold">
              {initial}
            </div>
          )}
        </div>
        {/* Green pulse dot */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 13,
              height: 13,
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #F8FAFC',
              zIndex: 10,
            }}
          >
            <div
              className="animate-ping"
              style={{
                position: 'absolute',
                inset: -2,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.4)',
              }}
            />
          </div>
        )}
      </div>
      {/* Name */}
      <span
        className="truncate text-center"
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'hsl(var(--muted-foreground))',
          maxWidth: 62,
        }}
      >
        {displayName}
      </span>
    </button>
  );
}
