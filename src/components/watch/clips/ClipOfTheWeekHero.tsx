import { memo } from 'react';
import { Play } from 'lucide-react';
import { useClipOfTheWeek } from './hooks/useClipOfTheWeek';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Kicker } from '../proshop/Kicker';
import { Pin } from '../proshop/Pin';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Editorial Clip of the Week hero. Portrait 9:16 card, AI "Why this one"
 * blurb beneath. Distinct from Watch of the Week (amber) by using the
 * emerald season-green kicker so the two heroes feel related but separate.
 *
 * Hides entirely when no qualifying clip exists for the week.
 */
function ClipOfTheWeekHeroInner() {
  const { data: pick, isLoading } = useClipOfTheWeek();

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
    <section style={{ padding: '24px 16px 12px' }}>
      <Kicker color="emerald">Clip of the Week</Kicker>

      <button
        type="button"
        onClick={handleTap}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '9/16',
          maxHeight: 460,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'transparent',
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

        {/* Top-left badges: format + duration + course */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, maxWidth: 'calc(100% - 80px)', flexWrap: 'wrap' }}>
          <Pin variant="dark">
            CLIP{pick.duration_seconds ? ` · ${formatDuration(pick.duration_seconds)}` : ''}
          </Pin>
          {pick.course_name ? (
            <Pin variant="dark" icon={<span style={{ fontSize: 10 }}>📍</span>}>
              {pick.course_name}
            </Pin>
          ) : null}
        </div>

        {/* Bottom: title + creator + counts */}
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
          <span style={{ fontWeight: 700, color: '#0F172A' }}>Why this one: </span>
          {pick.why_ai}
        </p>
      ) : null}
    </section>
  );
}

export const ClipOfTheWeekHero = memo(ClipOfTheWeekHeroInner);
export default ClipOfTheWeekHero;
