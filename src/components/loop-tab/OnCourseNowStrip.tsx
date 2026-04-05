import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
            <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div
          className="flex items-center gap-4 px-4 pb-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-[72px] h-[72px] bg-muted animate-pulse" style={{ borderRadius: '34%' }} />
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
      <div className="flex items-center justify-between" style={{ padding: '10px 16px 8px' }}>
        <div className="flex items-center gap-2">
          <div className="relative" style={{ width: 9, height: 9 }}>
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: hasActiveFriends ? '#22c55e' : 'hsl(var(--muted-foreground))',
                boxShadow: hasActiveFriends ? '0 0 0 3px rgba(34,197,94,0.15)' : 'none',
              }}
            />
            {hasActiveFriends && (
              <div
                className="animate-ping"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.4)',
                }}
              />
            )}
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
            Recently active
          </span>
        </div>
        <button
          onClick={() => navigate('/golferstofollow')}
          className="flex items-center gap-1 active:scale-[0.97] transition-transform"
          style={{ fontSize: 13, fontWeight: 600, color: '#F7931E' }}
        >
          See all
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Stories strip */}
      <div
        className="flex items-start overflow-x-auto"
        style={{
          padding: '4px 16px 14px',
          gap: 16,
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
      style={{ gap: 5 }}
    >
      {/* Outer ring — amber gradient for active, subtle border for inactive */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          borderRadius: '34%',
          background: isActive
            ? 'linear-gradient(135deg, #F59E0B, #F7931E)'
            : 'hsl(var(--border))',
          padding: isActive ? 2.5 : 1.5,
        }}
      >
        {/* Inner white gap ring */}
        <div
          className="flex items-center justify-center"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '32%',
            background: 'white',
            padding: isActive ? 2 : 1.5,
          }}
        >
          {/* Avatar */}
          <div
            className="w-full h-full overflow-hidden"
            style={{ borderRadius: '30%' }}
          >
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
        </div>

        {/* Green presence dot */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#22c55e',
              border: '2.5px solid white',
              zIndex: 10,
            }}
          >
            <div
              className="animate-ping"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 16,
                height: 16,
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
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
          maxWidth: 68,
        }}
      >
        {displayName}
      </span>
    </button>
  );
}
