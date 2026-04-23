import { memo } from 'react';
import { useWatchOfTheWeek } from './hooks/useWatchOfTheWeek';
import { useWatchMood } from './hooks/useWatchMood';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Kicker } from './Kicker';
import { Pin } from './Pin';
import { PlayAffordance } from './PlayAffordance';
// Note: useNavigate import previously here was unused.

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function WatchOfTheWeekHeroInner() {
  const { session } = useSupabaseSession();
  const { mood } = useWatchMood();
  const { data: pick, isLoading } = useWatchOfTheWeek(session?.user?.id, mood);

  if (isLoading || !pick) return null;

  const handleTap = () => {
    // Open fullscreen viewer with a synthetic single-post array. The viewer
    // accepts the FeedPost shape; we provide the minimum fields it needs.
    useFullscreenFeedStore.getState().open(
      [{
        id: pick.post_id,
        userId: pick.user_id,
        actorType: 'personal',
        actorId: pick.user_id,
        username: pick.username ?? '',
        displayName: pick.display_name ?? '',
        avatarUrl: pick.avatar_url ?? '',
        isVerified: pick.is_verified,
        creatorRelation: 'none',
        caption: pick.caption ?? '',
        mediaItems: [{
          id: pick.post_id,
          type: 'video',
          hlsUrl: pick.hls_url ?? undefined,
          imageUrl: pick.thumbnail_url ?? undefined,
          thumbnailUrl: pick.thumbnail_url ?? undefined,
          width: 0,
          height: 0,
          duration: pick.duration_seconds ?? undefined,
        }],
        createdAt: pick.created_at,
        likeCount: pick.like_count,
        commentCount: pick.comment_count,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: false,
        isFollowedByMe: false,
        courseName: pick.course_name ?? undefined,
        courseId: pick.course_id ?? undefined,
      } as any],
      0,
    );
  };

  return (
    <section style={{ padding: '24px 16px 12px' }}>
      <Kicker color="amber">Watch of the Week</Kicker>

      <button
        type="button"
        onClick={handleTap}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#0F172A',
          border: 'none',
          padding: 0,
          marginTop: 6,
        }}
      >
        {pick.thumbnail_url ? (
          <img
            src={pick.thumbnail_url}
            alt={pick.caption ?? ''}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {/* Bottom gradient */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)',
          }}
        />

        {/* Top-left badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, maxWidth: 'calc(100% - 80px)' }}>
          <Pin variant="dark">{pick.format === 'clip' ? 'CLIP' : 'VIDEO'}</Pin>
          {pick.course_name ? (
            <Pin variant="dark" icon={<span style={{ fontSize: 10 }}>📍</span>}>
              {pick.course_name}
            </Pin>
          ) : null}
        </div>

        {/* Center play */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <PlayAffordance size={56} variant="outlined" />
        </div>

        {/* Bottom: title + creator + duration */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: 'white' }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.015em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {pick.caption || (pick.display_name ? `${pick.display_name} on Clbhouz` : 'Featured')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pick.display_name || pick.username || 'Clbhouz'}
            </span>
            {pick.duration_seconds ? <span aria-hidden>·</span> : null}
            {pick.duration_seconds ? <span>{formatDuration(pick.duration_seconds)}</span> : null}
          </div>
        </div>
      </button>

      {pick.why_ai ? (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(15,23,42,0.72)',
          }}
        >
          <span style={{ fontWeight: 700, color: '#0F172A' }}>Why we're featuring this: </span>
          {pick.why_ai}
        </p>
      ) : null}
    </section>
  );
}

export const WatchOfTheWeekHero = memo(WatchOfTheWeekHeroInner);
