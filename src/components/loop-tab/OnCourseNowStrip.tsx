import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useNetworkActivity, type NetworkFriend } from '@/hooks/useNetworkActivity';

interface OnCourseNowStripProps {
  userId: string | undefined;
  /** When true, suppresses the internal header row (used by Home wrapper that supplies its own eyebrow). */
  hideHeader?: boolean;
}

export function OnCourseNowStrip({ userId, hideHeader = false }: OnCourseNowStripProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNetworkActivity(userId);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div style={{ padding: hideHeader ? '0 16px' : '12px 16px' }}>
        {!hideHeader && (
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          </div>
        )}
        <div
          className="flex gap-2 overflow-hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-2xl" style={{ minWidth: 160 }} />
          ))}
        </div>
      </div>
    );
  }

  const friends = data?.friends ?? [];

  // Filter to only those active in last 30 days (have last_activity set)
  const activeFriends = friends.filter(f => f.last_activity !== null);
  if (activeFriends.length === 0) return null;

  const visibleFriends = activeFriends.slice(0, 10);
  const onlineCount = visibleFriends.filter(f => f.is_active_recently).length;

  return (
    <div style={{ borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '10px 16px 8px' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.015em' }}>
            Recently active
          </span>
          {onlineCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#15803D',
                background: 'rgba(21,128,61,0.08)',
                borderRadius: 10,
                padding: '2px 8px',
              }}
            >
              {onlineCount} this week
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/golferstofollow')}
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.005em',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: 0,
          }}
        >
          See all
          <ChevronRight size={12} strokeWidth={2.4} color="#0F172A" />
        </button>
      </div>

      {/* Pill cards — horizontal scroll */}
      <div
        className="flex gap-2 overflow-x-auto"
        style={{
          padding: '4px 16px 14px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleFriends.map(friend => (
          <FriendPill
            key={friend.id}
            friend={friend}
            onTap={() => navigate(`/profile/${friend.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function FriendPill({ friend, onTap }: { friend: NetworkFriend; onTap: () => void }) {
  const isActive = friend.is_active_recently;
  const displayName = friend.display_name || friend.username || '?';
  const initial = displayName.trim().charAt(0).toUpperCase();

  const timeAgo = friend.last_activity
    ? formatDistanceToNow(new Date(friend.last_activity), { addSuffix: false })
        .replace('about ', '')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' days', 'd')
        .replace(' day', 'd')
        .replace(' weeks', 'w')
        .replace(' week', 'w')
        .replace(' months', 'mo')
        .replace(' month', 'mo')
    : null;

  return (
    <button
      onClick={onTap}
      className="flex items-center shrink-0 active:scale-[0.97] transition-transform"
      style={{
        gap: 10,
        padding: '8px 14px 8px 8px',
        borderRadius: 20,
        border: isActive ? '1.5px solid rgba(34,197,94,0.25)' : '1px solid hsl(var(--border))',
        background: isActive ? 'rgba(34,197,94,0.04)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      {/* Avatar with green dot */}
      <div className="relative" style={{ width: 36, height: 36, flexShrink: 0 }}>
        {friend.profile_photo_url ? (
          <img
            src={friend.profile_photo_url}
            alt={displayName}
            style={{ width: 36, height: 36, borderRadius: '34%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div
            className="flex items-center justify-center bg-muted text-muted-foreground"
            style={{ width: 36, height: 36, borderRadius: '34%', fontSize: 14, fontWeight: 600 }}
          >
            {initial}
          </div>
        )}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid hsl(var(--background))',
            }}
          />
        )}
      </div>

      {/* Name + status */}
      <div className="flex flex-col items-start" style={{ gap: 1, minWidth: 0 }}>
        <span
          className="truncate"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
            maxWidth: 100,
          }}
        >
          {displayName}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isActive ? '#15803D' : 'hsl(var(--muted-foreground))',
          }}
        >
          {isActive ? `● Active` : timeAgo ? `${timeAgo} ago` : 'Recently'}
        </span>
      </div>
    </button>
  );
}
