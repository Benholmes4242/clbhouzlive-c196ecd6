import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SuggestedCreator } from '@/components/watch/hooks/useSuggestedCreators';




interface SuggestedCreatorCardProps {
  creator: SuggestedCreator;
  currentUserId: string;
  variant?: 'light' | 'dark';
  onFollowed?: (userId: string) => void;
}

export const SuggestedCreatorCard: React.FC<SuggestedCreatorCardProps> = ({
  creator,
  currentUserId,
  variant = 'light',
  onFollowed,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(creator.isFollowed);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);

  const isDark = variant === 'dark';

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
          // Animate out after 1200ms
          onFollowed?.(creator.userId);
          setTimeout(() => setRemoving(true), 1200);
        }
        queryClient.invalidateQueries({ queryKey: ['suggested-creators'] });
      } catch {
        setFollowing(wasFollowing);
      } finally {
        setBusy(false);
      }
    },
    [busy, following, creator.userId, currentUserId, queryClient, onFollowed],
  );

  // After removing animation completes, hide card
  useEffect(() => {
    if (removing) {
      const t = setTimeout(() => setRemoved(true), 350);
      return () => clearTimeout(t);
    }
  }, [removing]);

  if (removed) return null;

  const handleProfileTap = () => navigate(`/profile/${creator.userId}`);

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center"
      style={{
        width: 120,
        scrollSnapAlign: 'start',
        overflow: 'hidden',
        transition: removing ? 'width 350ms ease, opacity 350ms ease' : undefined,
        ...(removing ? { width: 0, opacity: 0 } : {}),
      }}
    >
      {/* Avatar with amber ring */}
      <div
        onClick={handleProfileTap}
        className="cursor-pointer"
        style={{
          width: 88,
          aspectRatio: '1 / 1',
          borderRadius: '34%',
          border: '1.5px solid rgba(245, 158, 11, 0.85)',
          padding: 2,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '34%',
            overflow: 'hidden',
            background: isDark ? 'rgba(255,255,255,0.1)' : 'hsl(var(--muted))',
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
                background: isDark ? 'rgba(255,255,255,0.1)' : 'hsl(var(--muted))',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'hsl(var(--muted-foreground))',
                fontSize: 24,
                fontWeight: 600,
                borderRadius: '34%',
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Verified badge */}
        {creator.isVerified && (
          <div
            className="flex items-center justify-center"
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#D97706',
              border: isDark ? '2px solid #000' : '2px solid hsl(var(--background))',
            }}
          >
            <Check className="text-white" style={{ width: 10, height: 10 }} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Name */}
      <p
        onClick={handleProfileTap}
        className="text-center truncate cursor-pointer"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? '#ffffff' : 'hsl(var(--foreground))',
          maxWidth: 108,
          marginTop: 8,
          lineHeight: '16px',
        }}
      >
        {creator.displayName}
      </p>

      {/* Stat pill */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          fontSize: 10,
          fontWeight: 600,
          height: 'auto',
          padding: '3px 10px',
          marginTop: 4,
          lineHeight: '1',
          borderRadius: 9999,
          ...(creator.handicap != null
            ? isDark
              ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }
              : { background: '#FEF3C7', color: '#92400E' }
            : isDark
              ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
              : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }),
        }}
      >
        {creator.handicap != null
          ? `HCP ${creator.handicap}`
          : `${creator.videoCount} videos`}
      </div>

      {/* Home club */}
      {creator.homeCourse && (
        <p
          className="text-center truncate"
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: isDark ? 'rgba(255,255,255,0.5)' : 'hsl(var(--muted-foreground))',
            maxWidth: 108,
            marginTop: 2,
            lineHeight: '14px',
          }}
        >
          {creator.homeCourse}
        </p>
      )}

      {/* Follow button */}
      <button
        onClick={handleFollow}
        className="active:scale-[0.96]"
        style={{
          width: 108,
          height: 34,
          borderRadius: 10,
          fontSize: following ? 10 : 12,
          fontWeight: 600,
          marginTop: 8,
          cursor: 'pointer',
          transition: 'transform 100ms ease',
          ...(following
            ? isDark
              ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: 'none' }
              : { background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }
            : isDark
              ? { background: '#ffffff', color: '#000000', border: 'none' }
              : { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', border: 'none' }),
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

/** Shimmer placeholder for loading state */
export const SuggestedCreatorCardShimmer: React.FC = () => (
  <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 120, gap: 8 }}>
    <div
      className="animate-[shimmer_1.5s_infinite]"
      style={{
        width: 88,
        aspectRatio: '1 / 1.05',
        borderRadius: '34%',
        background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
    <div
      className="rounded animate-[shimmer_1.5s_infinite]"
      style={{
        width: 64,
        height: 12,
        background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
    <div
      className="rounded-full animate-[shimmer_1.5s_infinite]"
      style={{
        width: 52,
        height: 12,
        background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 75%)',
        backgroundSize: '200% 100%',
      }}
    />
  </div>
);
