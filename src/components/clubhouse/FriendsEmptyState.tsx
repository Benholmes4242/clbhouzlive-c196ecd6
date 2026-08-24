/**
 * FriendsEmptyState — "Build your fourball" empty state for the Friends tab.
 *
 * Renders on the healthy-but-empty case only (no posts, no error). The error
 * state is owned by Clubhouse.tsx and stays separate.
 *
 * Data:
 *   - Suggestions come from useSuggestedCreators (watch/hooks) — this is now its
 *     only consumer.
 *   - Follows go through useToggleFollow (optimistic; onError rollback via toast).
 *   - Fourball spine seeds from useSocialCounts (following count) + useSocialListV2
 *     (avatars) and increments as follows happen on this screen.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Search, Send, Check } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSuggestedCreators, type SuggestedCreator } from '@/components/watch/hooks/useSuggestedCreators';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useSocialListV2 } from '@/features/social-lists-v2/hooks/useSocialListV2';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { toast } from '@/lib/toast';

const CHARCOAL = '#15171F';
const CARD = '#1B1E27';
const AMBER = '#F7931E';
const INK_MUTED = 'rgba(255,255,255,0.60)';
const INK_FAINT = 'rgba(255,255,255,0.40)';
const HAIRLINE = 'rgba(255,255,255,0.10)';

const SPINE_SLOTS = 4;
const TARGET_FOLLOWS = 3; // fourball = user + 3

interface FollowedSeed {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface FriendsEmptyStateProps {
  userId: string;
  /** Refetches the friends feed once the fourball completes. */
  onSeeYourFeed: () => void;
}

export const FriendsEmptyState: React.FC<FriendsEmptyStateProps> = ({ userId, onSeeYourFeed }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? userId;
  const toggle = useToggleFollow();

  const { data: profile } = useUserProfile(userId);
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestedCreators(userId);
  const { data: counts } = useSocialCounts({ type: 'personal', id: userId });
  const followingList = useSocialListV2({
    actorType: 'personal',
    actorId: userId,
    direction: 'following',
    viewerId: userId,
  });

  const existingFollowedSeeds: FollowedSeed[] = useMemo(() => {
    const rows = followingList.data?.pages.flatMap((p) => p.rows) ?? [];
    return rows
      .filter((r) => r.actor_type === 'personal')
      .map((r) => ({
        userId: r.actor_id,
        displayName: r.display_name ?? r.username ?? '',
        avatarUrl: r.avatar_url,
      }));
  }, [followingList.data]);

  // Track follows made on this screen (session follows come first in the spine).
  const [sessionFollows, setSessionFollows] = useState<FollowedSeed[]>([]);

  const existingFollowsCount = counts?.following ?? 0;

  // Slots list: [user, session..., existing backfill...]
  const spineSeeds: FollowedSeed[] = useMemo(() => {
    const seen = new Set<string>();
    const out: FollowedSeed[] = [];
    for (const s of sessionFollows) {
      if (seen.has(s.userId)) continue;
      seen.add(s.userId);
      out.push(s);
    }
    for (const s of existingFollowedSeeds) {
      if (seen.has(s.userId)) continue;
      seen.add(s.userId);
      out.push(s);
    }
    return out.slice(0, TARGET_FOLLOWS);
  }, [sessionFollows, existingFollowedSeeds]);

  // Progress: real following count + session follows for users not yet in
  // the fetched following list (avoids double count once the list catches up).
  const progress = useMemo(() => {
    const existingIds = new Set(existingFollowedSeeds.map((s) => s.userId));
    const newlyAdded = sessionFollows.filter((s) => !existingIds.has(s.userId)).length;
    return Math.min(TARGET_FOLLOWS, existingFollowsCount + newlyAdded);
  }, [existingFollowsCount, existingFollowedSeeds, sessionFollows]);

  const complete = progress >= TARGET_FOLLOWS;

  const handleFollow = useCallback(
    (creator: SuggestedCreator) => {
      if (toggle.isPending) return;
      const seed: FollowedSeed = {
        userId: creator.userId,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
      };
      // Optimistic session-seed insert; roll back on error.
      setSessionFollows((prev) => (prev.some((s) => s.userId === seed.userId) ? prev : [...prev, seed]));
      toggle.mutate(
        {
          targetActorType: 'personal',
          targetActorId: creator.userId,
          targetUserId: creator.userId,
          viewerActorType,
          viewerActorId,
          viewerUserId: userId,
          isFollowing: false,
        },
        {
          onSuccess: () => {
            // Drop the followed creator from the cached suggestion list: once
            // followed it is no longer a suggestion, so it should not linger.
            queryClient.setQueryData(
              ['suggested-creators', userId],
              (old: SuggestedCreator[] | undefined) =>
                old ? old.filter((c) => c.userId !== creator.userId) : old,
            );
            queryClient.invalidateQueries({ queryKey: ['social-counts', 'personal', userId] });
          },
          onError: () => {
            setSessionFollows((prev) => prev.filter((s) => s.userId !== seed.userId));
            toast.error("Couldn't follow. Try again.");
          },
        },
      );
    },
    [toggle, viewerActorType, viewerActorId, userId, queryClient],
  );

  const visibleSuggestions = (suggestions ?? []).slice(0, 5);

  const { openInviteSheet } = useInviteSheet();
  const openSearch = () => window.dispatchEvent(new Event('clbhouz:open-search'));

  const userInitials = (profile?.display_name || profile?.username || '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex flex-col w-full min-h-screen"
      style={{
        background: CHARCOAL,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)',
        paddingBottom: 120,
      }}
    >
      <style>{`
        @keyframes fourballSlotPop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .fb-slot-pop { animation: fourballSlotPop 260ms cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
        @media (prefers-reduced-motion: reduce) {
          .fb-slot-pop { animation: none; }
        }
      `}</style>

      {/* Headline */}
      <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 10,
          }}
        >
          Your clubhouse
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {complete ? 'Fourball complete' : 'Build your fourball'}
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: INK_MUTED,
            marginTop: 8,
            maxWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {complete
            ? 'Nice picks. Their rounds, reviews, and results will land here.'
            : 'Follow 3 golfers and this feed fills with their rounds, reviews, and results.'}
        </p>
      </div>

      {/* Fourball spine */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '4px 16px 12px',
        }}
      >
        {Array.from({ length: SPINE_SLOTS }).map((_, i) => {
          if (i === 0) {
            return (
              <div key="self" style={{ width: 52 }}>
                <SquircleAvatar
                  size={52}
                  src={profile?.profile_photo_url ?? null}
                  alt={profile?.display_name ?? 'You'}
                  fallback={userInitials}
                  hairlineRing
                  ringColor={AMBER}
                />
              </div>
            );
          }
          const seed = spineSeeds[i - 1];
          if (seed) {
            const initials = (seed.displayName || '?')
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={seed.userId} className="fb-slot-pop" style={{ width: 52 }}>
                <SquircleAvatar
                  size={52}
                  src={seed.avatarUrl}
                  alt={seed.displayName}
                  fallback={initials}
                  hairlineRing
                />
              </div>
            );
          }
          return (
            <div
              key={`empty-${i}`}
              style={{
                width: 52,
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
                background: 'rgba(255,255,255,0.04)',
                border: `1px dashed rgba(255,255,255,0.16)`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: INK_FAINT,
          marginBottom: 24,
        }}
      >
        {Math.min(TARGET_FOLLOWS, progress) + 1}/4 tee'd up
      </div>

      {/* Complete state CTA */}
      {complete ? (
        <div style={{ padding: '0 16px' }}>
          <button
            type="button"
            onClick={onSeeYourFeed}
            className="active:scale-[0.98]"
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              background: AMBER,
              color: CHARCOAL,
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              transition: 'transform 100ms ease',
              cursor: 'pointer',
            }}
          >
            See your feed
          </button>
        </div>
      ) : (
        <>
          {/* Suggestions list */}
          <div style={{ padding: '0 16px' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: AMBER,
                margin: '0 4px 10px',
              }}
            >
              Suggested for you
            </div>
            <div
              style={{
                background: CARD,
                borderRadius: 16,
                border: `1px solid ${HAIRLINE}`,
                overflow: 'hidden',
              }}
            >
              {suggestionsLoading && visibleSuggestions.length === 0
                ? Array.from({ length: 3 }).map((_, i) => (
                    <SuggestionRowShimmer key={i} showDivider={i < 2} />
                  ))
                : visibleSuggestions.map((c, i) => (
                    <SuggestionRow
                      key={c.userId}
                      creator={c}
                      showDivider={i < visibleSuggestions.length - 1}
                      followed={sessionFollows.some((s) => s.userId === c.userId)}
                      busy={toggle.isPending}
                      onFollow={() => handleFollow(c)}
                      onOpenProfile={() => navigate(`/profile/${c.userId}`)}
                    />
                  ))}

              {/* See all row */}
              <button
                type="button"
                onClick={() => navigate('/golferstofollow')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: `1px solid ${HAIRLINE}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                See all golfers
                <ChevronRight size={16} color={INK_MUTED} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Secondary actions */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '20px 16px 0',
        }}
      >
        <SecondaryAction icon={<Search size={16} />} label="Search golfers" onClick={openSearch} />
        <SecondaryAction
          icon={<Send size={16} />}
          label="Invite a friend"
          onClick={() => openInviteSheet('friends_empty_state')}
        />
      </div>
    </div>
  );
};

/* ─────────────────────────  Row + shimmer  ───────────────────────── */

interface SuggestionRowProps {
  creator: SuggestedCreator;
  showDivider: boolean;
  followed: boolean;
  busy: boolean;
  onFollow: () => void;
  onOpenProfile: () => void;
}

const SuggestionRow: React.FC<SuggestionRowProps> = ({
  creator,
  showDivider,
  followed,
  busy,
  onFollow,
  onOpenProfile,
}) => {
  const initials = (creator.displayName || '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderBottom: showDivider ? `1px solid ${HAIRLINE}` : 'none',
      }}
    >
      <button
        type="button"
        onClick={onOpenProfile}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <SquircleAvatar
          size={46}
          src={creator.avatarUrl}
          alt={creator.displayName}
          fallback={initials}
          hairlineRing
        />
      </button>

      <button
        type="button"
        onClick={onOpenProfile}
        style={{
          flex: 1,
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {creator.displayName}
        </div>
        <div
          style={{
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: INK_MUTED,
          }}
        >
          {creator.homeCourse && (
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
              {creator.homeCourse}
            </span>
          )}
          {creator.handicap != null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 999,
                background: 'rgba(247,147,30,0.14)',
                color: AMBER,
                whiteSpace: 'nowrap',
              }}
            >
              HCP {creator.handicap}
            </span>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onFollow}
        disabled={busy || followed}
        className="active:scale-[0.96]"
        style={{
          minWidth: 96,
          height: 34,
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          border: 'none',
          transition: 'transform 100ms ease',
          cursor: followed ? 'default' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          ...(followed
            ? { background: 'transparent', color: INK_FAINT, border: '1px solid rgba(255,255,255,0.16)' }
            : { background: '#FFFFFF', color: '#000000' }),
        }}
      >
        {followed && <Check size={12} strokeWidth={2.6} />}
        {followed ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

const SuggestionRowShimmer: React.FC<{ showDivider: boolean }> = ({ showDivider }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderBottom: showDivider ? `1px solid ${HAIRLINE}` : 'none',
    }}
  >
    <div
      style={{
        width: 46,
        aspectRatio: '1 / 1.05',
        borderRadius: '34%',
        background: 'rgba(255,255,255,0.06)',
      }}
    />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ height: 12, width: '55%', background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
      <div style={{ height: 10, width: '35%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
    </div>
    <div style={{ width: 88, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)' }} />
  </div>
);

const SecondaryAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="active:scale-[0.98]"
    style={{
      flex: 1,
      height: 44,
      borderRadius: 12,
      background: CARD,
      border: `1px solid ${HAIRLINE}`,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      cursor: 'pointer',
      transition: 'transform 100ms ease',
    }}
  >
    <span style={{ color: INK_MUTED, display: 'inline-flex' }}>{icon}</span>
    {label}
  </button>
);
