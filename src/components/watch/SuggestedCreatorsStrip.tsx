import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSuggestedCreators, type SuggestedCreator } from './hooks/useSuggestedCreators';

// ── Format name as "First L." ──
function shortName(displayName: string): string {
  const parts = (displayName || '').trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || '?';
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// ── Shimmer placeholder ──
const ShimmerItem: React.FC = () => (
  <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 80, gap: 6 }}>
    <div
      className="rounded-full animate-[shimmer_1.5s_infinite]"
      style={{
        width: 64,
        height: 64,
        background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
    <div
      className="rounded animate-[shimmer_1.5s_infinite]"
      style={{
        width: 52,
        height: 10,
        background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
    <div
      className="rounded-full animate-[shimmer_1.5s_infinite]"
      style={{
        width: 44,
        height: 16,
        background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  </div>
);

// ── Single creator item ──
interface CreatorItemProps {
  creator: SuggestedCreator;
  currentUserId: string;
}

const CreatorItem: React.FC<CreatorItemProps> = ({ creator, currentUserId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(creator.isFollowed);
  const [busy, setBusy] = useState(false);

  const initials = (creator.displayName || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleFollow = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (busy) return;
      const wasFollowing = following;
      setFollowing(!wasFollowing);
      setBusy(true);
      try {
        if (wasFollowing) {
          await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', creator.userId);
        } else {
          await supabase.from('user_follows').insert({
            follower_id: currentUserId,
            following_id: creator.userId,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['suggested-creators'] });
      } catch {
        setFollowing(wasFollowing);
      } finally {
        setBusy(false);
      }
    },
    [busy, following, creator.userId, currentUserId, queryClient],
  );

  const handleProfileTap = useCallback(() => {
    navigate(`/profile/${creator.userId}`);
  }, [navigate, creator.userId]);

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center"
      style={{ width: 80, gap: 6, scrollSnapAlign: 'start' }}
    >
      <div
        onClick={handleProfileTap}
        className="cursor-pointer"
        style={{
          width: 64,
          height: 67,
          borderRadius: '34%',
          border: '0.5px solid rgba(245, 158, 11, 0.9)',
          padding: 1,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'hsl(var(--muted))',
          }}
        >
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ borderRadius: '34%' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                fontSize: 20,
                fontWeight: 600,
                borderRadius: '34%',
              }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      {creator.isVerified && (
        <div
          className="flex items-center justify-center"
          style={{
            position: 'relative',
            top: -18,
            marginBottom: -18,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#D97706',
            border: '2px solid hsl(var(--background))',
            alignSelf: 'center',
            marginLeft: 24,
          }}
        >
          <Check className="w-2 h-2 text-white" strokeWidth={3} />
        </div>
      )}

      <p
        onClick={handleProfileTap}
        className="w-full text-center truncate cursor-pointer"
        style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: '16px' }}
      >
        {shortName(creator.displayName)}
      </p>

      <div
        className="flex items-center justify-center"
        style={{
          borderRadius: 8,
          padding: '2px 8px',
          fontSize: 10,
          fontWeight: 600,
          lineHeight: '14px',
          ...(creator.handicap != null
            ? { background: '#FEF3C7', color: '#92400E' }
            : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }),
        }}
      >
        {creator.handicap != null
          ? `HCP ${creator.handicap}`
          : `${creator.videoCount} videos`}
      </div>

      <button
        onClick={handleFollow}
        className="active:scale-[0.96]"
        style={{
          width: 72,
          height: 28,
          borderRadius: 8,
          fontSize: following ? 10 : 11,
          fontWeight: 600,
          background: following ? 'transparent' : 'hsl(var(--foreground))',
          color: following ? 'hsl(var(--muted-foreground))' : 'hsl(var(--background))',
          border: following ? '1px solid hsl(var(--border))' : 'none',
          cursor: 'pointer',
          transition: 'transform 100ms ease',
          marginTop: 2,
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

// ── Main strip ──
interface SuggestedCreatorsStripProps {
  userId: string | undefined;
}

const SuggestedCreatorsStrip: React.FC<SuggestedCreatorsStripProps> = ({ userId }) => {
  const { data: creators, isLoading } = useSuggestedCreators(userId);

  if (isLoading) {
    return (
      <div style={{ gridColumn: '1 / -1', padding: '14px 0', background: 'hsl(var(--background))', borderTop: '1px solid hsl(var(--muted))', borderBottom: '1px solid hsl(var(--muted))' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', padding: '0 16px', marginBottom: 12 }}>
          People to follow
        </p>
        <div
          className="flex"
          style={{ gap: 16, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <ShimmerItem key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!creators || creators.length < 2) {
    return null;
  }

  return (
    <div style={{ gridColumn: '1 / -1', padding: '14px 0', background: 'hsl(var(--background))', borderTop: '1px solid hsl(var(--muted))', borderBottom: '1px solid hsl(var(--muted))' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', padding: '0 16px', marginBottom: 12 }}>
        People to follow
      </p>

      <div
        className="flex"
        style={{
          gap: 16,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          padding: '0 16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {creators.map((creator) => (
          <CreatorItem key={creator.userId} creator={creator} currentUserId={userId!} />
        ))}
      </div>
    </div>
  );
};

export default SuggestedCreatorsStrip;