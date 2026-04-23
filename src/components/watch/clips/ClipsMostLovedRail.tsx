import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { MostLovedRow } from '../proshop/hooks/useMostLovedThisWeek';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import { Pin } from '../proshop/Pin';
import type { ClipsMoodId } from './hooks/useClipsMood';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface ClipsMostLovedRailProps {
  userId: string | undefined;
  mood: ClipsMoodId;
}

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
  const out: MostLovedRow[] = [];
  for (const row of rows) {
    if (
      out.length >= 2 &&
      out[out.length - 1].user_id === row.user_id &&
      out[out.length - 2].user_id === row.user_id
    ) {
      continue;
    }
    out.push(row);
  }
  return out;
}

/**
 * "Most-loved this month" rail (Clips). Reuses get_watch_most_loved_this_week
 * with the new `p_format='clip'` and `p_window='month'` parameters so we
 * widen the lookback to 30 days and only return short-form.
 *
 * Maps Clips moods → RPC moods (which doesn't know 'lightning' / 'your_courses'
 * / 'friends' verbatim — we fold them into the closest RPC vocab).
 */
function ClipsMostLovedRailInner({ userId, mood }: ClipsMostLovedRailProps) {
  const rpcMood =
    mood === 'your_courses' ? 'played_courses' :
    mood === 'friends' ? 'follows' :
    mood === 'trending' ? 'for_you' /* RPC already orders by engagement */ :
    'for_you';

  const { data: rowsRaw = [], isLoading } = useQuery({
    queryKey: ['clips-most-loved-month', userId ?? null, rpcMood],
    queryFn: async (): Promise<MostLovedRow[]> => {
      const { data, error } = await supabase.rpc(
        'get_watch_most_loved_this_week' as any,
        {
          p_limit: 12,
          p_user_id: userId ?? null,
          p_mood: rpcMood,
          p_format: 'clip',
          p_window: 'month',
        },
      );
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[ClipsMostLovedRail] RPC error:', error);
          throw error;
        }
        return [];
      }
      return (data as MostLovedRow[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading || rowsRaw.length === 0) return null;

  const rows = diversifyByCreator(rowsRaw).slice(0, 10);
  const allPosts = rows.map(rowToFullscreenPost);

  return (
    <section>
      <SectionHeader
        title="Most-loved this month"
        sub="The clips your community keeps watching"
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

            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <Pin variant="dark">CLIP</Pin>
            </div>

            {row.course_name ? (
              <div style={{ position: 'absolute', top: 8, right: 8, maxWidth: 'calc(100% - 80px)' }}>
                <Pin variant="dark" icon={<span style={{ fontSize: 10, lineHeight: 1 }}>📍</span>}>
                  {row.course_name}
                </Pin>
              </div>
            ) : null}

            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Play size={13} fill="white" stroke="white" strokeWidth={1} style={{ marginLeft: 1 }} />
            </div>

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

            {/* Canonical glass-pill+avatar creator chip */}
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
          </button>
        ))}
      </HRail>
    </section>
  );
}

export const ClipsMostLovedRail = memo(ClipsMostLovedRailInner);
export default ClipsMostLovedRail;
