import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useMostLovedThisWeek, type MostLovedRow } from './hooks/useMostLovedThisWeek';
import { useWatchMood } from './hooks/useWatchMood';
import { SectionHeader } from './SectionHeader';
import { HRail } from './HRail';
import { Pin } from './Pin';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useActiveActor } from '@/context/ActiveActorContext';
import { fetchLikedPostIds } from '@/lib/likedPostIds';

function rowToFullscreenPost(row: MostLovedRow) {
  return {
    id: row.post_id,
    userId: row.user_id,
    actorType: 'personal',
    actorId: row.user_id,
    username: row.username ?? '',
    displayName: row.display_name ?? '',
    avatarUrl: row.avatar_url ?? '',
    isVerified: row.is_verified,
    creatorRelation: 'none',
    caption: row.caption ?? '',
    mediaItems: [{
      id: row.post_id,
      type: 'video',
      hlsUrl: row.hls_url ?? undefined,
      imageUrl: row.thumbnail_url ?? undefined,
      thumbnailUrl: row.thumbnail_url ?? undefined,
      width: 0,
      height: 0,
      duration: row.duration_seconds ?? undefined,
    }],
    createdAt: row.created_at,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    shareCount: 0,
    review: null,
    isReview: false,
    isLikedByMe: false,
    isFollowedByMe: false,
    courseName: row.course_name ?? undefined,
    courseId: row.course_id ?? undefined,
  } as any;
}

function diversifyByCreator(rows: MostLovedRow[]): MostLovedRow[] {
  // Cap 2 consecutive posts from the same creator at the head of the list.
  // Collisions are deferred to a queue and appended in original order at the
  // tail so the output length always equals the input length.
  const out: MostLovedRow[] = [];
  const deferred: MostLovedRow[] = [];
  for (const row of rows) {
    if (
      out.length >= 2 &&
      out[out.length - 1].user_id === row.user_id &&
      out[out.length - 2].user_id === row.user_id
    ) {
      deferred.push(row);
      continue;
    }
    out.push(row);
  }
  return [...out, ...deferred];
}

function MostLovedRailInner() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { mood } = useWatchMood();
  const { data: rowsRaw = [], isLoading } = useMostLovedThisWeek(12, session?.user?.id, mood);
  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;

  const rows = useMemo(
    () => (rowsRaw.length ? diversifyByCreator(rowsRaw).slice(0, 10) : []),
    [rowsRaw],
  );
  const postIds = useMemo(() => rows.map((r) => r.post_id), [rows]);

  const { data: likedIds = new Set<string>() } = useQuery({
    queryKey: ['most-loved-liked', actor?.id, actor?.type, postIds.join(',')],
    queryFn: () => fetchLikedPostIds(postIds, actor),
    enabled: postIds.length > 0,
    staleTime: 60_000,
  });

  if (isLoading || rowsRaw.length === 0) return null;

  const allPosts = rows.map((r) => {
    const p = rowToFullscreenPost(r);
    p.isLikedByMe = likedIds.has(r.post_id);
    return p;
  });

  return (
    <section>
      <SectionHeader
        title="Most loved this week"
        sub="What the community is watching"
        action={{ label: 'See all', onClick: () => navigate('/watch/clips') }}
      />
      <HRail>
        {rows.map((row, idx) => (
          <button
            key={row.post_id}
            type="button"
            onClick={() => useFullscreenFeedStore.getState().open(allPosts, idx)}
            style={{
              flexShrink: 0,
              position: 'relative',
              width: 200,
              aspectRatio: '4/5',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              cursor: 'pointer',
              scrollSnapAlign: 'start',
            }}
          >
            {row.thumbnail_url ? (
              <img
                src={row.thumbnail_url}
                alt=""
                loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}

            {/* Course pin — top centre (matches WatchTile in More to Explore) */}
            {row.course_name ? (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: 'calc(100% - 24px)',
                  zIndex: 3,
                }}
              >
                <Pin variant="dark" icon={<span style={{ fontSize: 10, lineHeight: 1 }}>📍</span>}>
                  {row.course_name}
                </Pin>
              </div>
            ) : null}

            {/* Bottom gradient */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Bottom-left creator — canonical glass-pill+avatar */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: 999,
                padding: '2px 8px 2px 2px',
                maxWidth: 'calc(100% - 16px)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <SquircleAvatar
                  src={row.avatar_url}
                  alt={row.display_name || row.username || ''}
                  size={18}
                  hideRing
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 130,
                }}
              >
                {row.display_name || row.username || ''}
              </span>
            </div>

            {/* Likes — amber heart, bottom-right (mirrors WatchTile / WatchRailTile) */}
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
            >
              <Heart size={13} strokeWidth={1.8} style={{ color: '#F7931E', fill: '#F7931E' }} />
              {row.like_count}
            </div>
          </button>
        ))}
      </HRail>
    </section>
  );
}

export const MostLovedRail = memo(MostLovedRailInner);
