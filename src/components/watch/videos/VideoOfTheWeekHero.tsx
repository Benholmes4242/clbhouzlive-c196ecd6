import { memo } from 'react';
import { Play, Clock } from 'lucide-react';
import { useVideoOfTheWeek } from './hooks/useVideoOfTheWeek';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Kicker } from '../proshop/Kicker';
import { Pin } from '../proshop/Pin';

function formatHMS(seconds: number | null): string {
  if (!seconds) return '';
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

/**
 * Video of the Week — landscape 16:9 hero. Editorial twin of the Clip of the
 * Week portrait card. Amber kicker (default) keeps it visually consistent
 * with Watch of the Week, distinct from Clips' emerald.
 */
function VideoOfTheWeekHeroInner() {
  const { data: pick, isLoading } = useVideoOfTheWeek();

  if (isLoading || !pick) return null;

  const handleTap = () => {
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
    <section style={{ padding: '20px 16px 8px' }}>
      <Kicker color="amber">Video of the Week</Kicker>

      <button
        type="button"
        onClick={handleTap}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 14,
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

        {/* Top-left badges: format + course */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, maxWidth: 'calc(100% - 110px)', flexWrap: 'wrap' }}>
          <Pin variant="dark">VIDEO</Pin>
          {pick.course_name ? (
            <Pin variant="dark" icon={<span style={{ fontSize: 10 }}>📍</span>}>
              {pick.course_name}
            </Pin>
          ) : null}
        </div>

        {/* Top-right duration */}
        {pick.duration_seconds ? (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <Pin variant="dark" icon={<Clock size={11} />}>
              {formatHMS(pick.duration_seconds)}
            </Pin>
          </div>
        ) : null}

        {/* Centre play affordance */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Play size={22} fill="white" stroke="white" strokeWidth={1} style={{ marginLeft: 2 }} />
        </div>

        {/* Bottom: title + creator + counts */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: 'white' }}>
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              lineHeight: 1.2,
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
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
              {pick.display_name || pick.username || 'Clbhouz'}
            </span>
            <span aria-hidden>·</span>
            <span>♥ {pick.like_count}</span>
            <span aria-hidden>·</span>
            <span>💬 {pick.comment_count}</span>
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
          <span style={{ fontWeight: 700, color: '#0F172A' }}>Why we’re featuring this: </span>
          {pick.why_ai}
        </p>
      ) : null}
    </section>
  );
}

export const VideoOfTheWeekHero = memo(VideoOfTheWeekHeroInner);
export default VideoOfTheWeekHero;
