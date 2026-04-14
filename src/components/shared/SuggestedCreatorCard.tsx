import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { SuggestedCreator } from '@/components/watch/hooks/useSuggestedCreators';

function splitName(displayName: string): { first: string; last: string } {
  const parts = (displayName || '').trim().split(/\s+/);
  if (parts.length < 2) return { first: parts[0] || '?', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

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
          onFollowed?.(creator.userId);
          setTimeout(() => setRemoving(true), 1200);
        }
        queryClient.setQueryData(
          ['suggested-creators', currentUserId],
          (old: SuggestedCreator[] | undefined) =>
            old ? old.filter((c) => c.userId !== creator.userId) : old,
        );
        queryClient.invalidateQueries({ queryKey: ['suggested-creators', currentUserId] });
      } catch {
        setFollowing(wasFollowing);
      } finally {
        setBusy(false);
      }
    },
    [busy, following, creator.userId, currentUserId, queryClient, onFollowed],
  );

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
        width: 150,
        scrollSnapAlign: 'start',
        overflow: 'hidden',
        transition: removing ? 'width 350ms ease, opacity 350ms ease' : undefined,
        ...(removing ? { width: 0, opacity: 0 } : {}),
      }}
    >
      {/* Avatar */}
      <div onClick={handleProfileTap} className="cursor-pointer relative" style={{ width: 88, flexShrink: 0 }}>
        <SquircleAvatar
          size={88}
          src={creator.avatarUrl}
          alt={creator.displayName}
          fallback={initials}
          hideRing={true}
        />
        {creator.isVerified && (
          <div className="flex items-center justify-center" style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#F7931E',
            border: isDark ? '2px solid #000' : '2px solid hsl(var(--background))',
            zIndex: 2,
          }}>
            <Check className="text-white" style={{ width: 10, height: 10 }} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Full name */}
      <div onClick={handleProfileTap} className="cursor-pointer text-center" style={{ marginTop: 8, width: '100%' }}>
        <p className="truncate" style={{
          fontSize: 13, fontWeight: 600, lineHeight: '16px',
          color: isDark ? '#ffffff' : 'hsl(var(--foreground))',
        }}>
          {creator.displayName}
        </p>
      </div>

      {/* Club + divider + HCP on one row */}
      <div onClick={handleProfileTap} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, marginTop: 5, width: '100%', cursor: 'pointer',
      }}>
        {creator.homeCourse && (
          <>
            <span style={{
              fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', maxWidth: 90,
              color: isDark ? 'rgba(255,255,255,0.50)' : 'hsl(var(--muted-foreground))',
            }}>
              {creator.homeCourse}
            </span>
            {creator.handicap != null && (
              <div style={{ width: 1, height: 10, background: isDark ? 'rgba(255,255,255,0.12)' : 'hsl(var(--border))', flexShrink: 0 }} />
            )}
          </>
        )}
        {creator.handicap != null && (
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: 9, fontWeight: 700, lineHeight: 1.4,
            padding: '2px 6px', borderRadius: 999,
            whiteSpace: 'nowrap',
            ...(isDark
              ? { background: 'rgba(247,147,30,0.12)', color: '#F7931E' }
              : { background: 'rgba(247,147,30,0.10)', color: '#F7931E' }),
          }}>
            HCP {creator.handicap}
          </div>
        )}
      </div>

      {/* Follow button */}
      <button
        onClick={handleFollow}
        onPointerDown={e => e.stopPropagation()}
        className="active:scale-[0.96]"
        style={{
          width: 138, height: 34, borderRadius: 10,
          fontSize: following ? 10 : 12, fontWeight: 600,
          marginTop: 10, cursor: 'pointer',
          transition: 'transform 100ms ease',
          ...(following
            ? isDark
              ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: 'none' }
              : { background: 'transparent', color: 'rgba(15,23,42,0.50)', border: '1px solid rgba(15,23,42,0.10)' }
            : isDark
              ? { background: '#ffffff', color: '#000000', border: 'none' }
              : { background: '#0F172A', color: '#ffffff', border: 'none' }),
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

/** Shimmer placeholder for loading state */
export const SuggestedCreatorCardShimmer: React.FC = () => (
  <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 150, gap: 8 }}>
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
        width: 90,
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
