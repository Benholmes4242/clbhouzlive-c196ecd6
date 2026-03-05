import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSuggestedCreators, type SuggestedCreator } from './hooks/useSuggestedCreators';

// ── Shimmer placeholder ──
const ShimmerCard: React.FC = () => (
  <div
    className="flex-shrink-0 rounded-2xl animate-[shimmer_1.5s_infinite]"
    style={{
      width: 140,
      height: 200,
      background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
      backgroundSize: '200% 100%',
    }}
  />
);

// ── Single creator card ──
interface CreatorCardProps {
  creator: SuggestedCreator;
  currentUserId: string;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator, currentUserId }) => {
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

  const handleCardTap = useCallback(() => {
    navigate(`/profile/${creator.userId}`);
  }, [navigate, creator.userId]);

  return (
    <div
      onClick={handleCardTap}
      className="flex-shrink-0 flex flex-col items-center cursor-pointer active:scale-[0.97]"
      style={{
        width: 140,
        borderRadius: 16,
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        padding: '16px 12px',
        gap: 6,
        transition: 'transform 100ms ease',
      }}
    >
      {/* Avatar */}
      <div className="relative" style={{ width: 56, height: 56 }}>
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
        )}
        {creator.isVerified && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#D97706',
              border: '2px solid hsl(var(--card))',
            }}
          >
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Display name */}
      <p
        className="w-full text-center truncate"
        style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}
      >
        {creator.displayName}
      </p>

      {/* Username */}
      <p
        className="w-full text-center truncate"
        style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}
      >
        @{creator.username}
      </p>

      {/* Handicap or video count */}
      <p
        className="text-center"
        style={{ fontSize: 11, fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}
      >
        {creator.handicap != null ? `⛳ ${creator.handicap}` : `🎬 ${creator.videoCount} videos`}
      </p>

      {/* Follow button */}
      <button
        onClick={handleFollow}
        className="w-full active:scale-[0.96]"
        style={{
          height: 32,
          borderRadius: 8,
          marginTop: 4,
          fontSize: 12,
          fontWeight: following ? 500 : 600,
          background: following ? 'transparent' : 'hsl(var(--foreground))',
          color: following ? 'hsl(var(--muted-foreground))' : 'hsl(var(--background))',
          border: following ? '1px solid hsl(var(--border))' : 'none',
          transition: 'transform 100ms ease',
          cursor: 'pointer',
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

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div
          className="flex items-center justify-between"
          style={{ padding: '0 16px', marginBottom: 10 }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            Suggested Creators
          </span>
        </div>
        <div
          className="flex"
          style={{
            gap: 10,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0 16px',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if < 1 creator (temporarily lowered from 2 for pre-launch testing)
  if (!creators || creators.length < 1) return null;

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '0 16px', marginBottom: 10 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          Suggested Creators
        </span>
        <span
          style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}
          className="cursor-pointer"
        >
          See All →
        </span>
      </div>

      {/* Scroll container */}
      <div
        className="flex"
        style={{
          gap: 10,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          padding: '0 16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {creators.map((creator) => (
          <div key={creator.userId} style={{ scrollSnapAlign: 'start' }}>
            <CreatorCard creator={creator} currentUserId={userId!} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedCreatorsStrip;
