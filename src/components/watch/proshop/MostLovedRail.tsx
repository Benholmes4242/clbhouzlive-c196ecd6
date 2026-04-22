import { memo } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useMostLovedThisWeek, type MostLovedRow } from './hooks/useMostLovedThisWeek';
import { useWatchMood } from './hooks/useWatchMood';
import { SectionHeader } from './SectionHeader';
import { HRail } from './HRail';
import { Pin } from './Pin';

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
  // Cap 2 consecutive posts from the same creator.
  const out: MostLovedRow[] = [];
  for (const row of rows) {
    if (out.length >= 2 && out[out.length - 1].user_id === row.user_id && out[out.length - 2].user_id === row.user_id) {
      // skip — defer to later; for simplicity, just drop it
      continue;
    }
    out.push(row);
  }
  return out;
}

function MostLovedRailInner() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { mood } = useWatchMood();
  const { data: rowsRaw = [], isLoading } = useMostLovedThisWeek(12, session?.user?.id, mood);

  if (isLoading || rowsRaw.length === 0) return null;

  const rows = diversifyByCreator(rowsRaw).slice(0, 10);
  const allPosts = rows.map(rowToFullscreenPost);

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
              width: 160,
              aspectRatio: '4/5',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#0F172A',
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

            {/* Format pin top-left */}
            <div style={{ position: 'absolute', top: 6, left: 6 }}>
              <Pin variant="dark">{row.format === 'clip' ? 'CLIP' : 'VIDEO'}</Pin>
            </div>

            {/* Center play */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Play size={13} fill="white" stroke="white" strokeWidth={1} style={{ marginLeft: 1 }} />
            </div>

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

            {/* Bottom-left creator + course */}
            <div
              style={{
                position: 'absolute',
                left: 8, right: 8, bottom: 8,
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                textAlign: 'left',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.display_name || row.username || ''}
              </div>
              {row.course_name ? (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    opacity: 0.85,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}
                >
                  📍 {row.course_name}
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </HRail>
    </section>
  );
}

export const MostLovedRail = memo(MostLovedRailInner);
