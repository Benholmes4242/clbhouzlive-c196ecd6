/**
 * WS1 §3 — THE LEAD (watch-s1.html, signed off — the mock is the spec).
 *
 * For you only, after the Creators row. One video, picked by get_watch_lead:
 * the newest creator video from the last 7 days, otherwise the most-liked of
 * the last 30. Upright sources lead tall (mock A, 440px media with the words
 * over a bottom gradient); landscape sources lead wide (mock B, 16:9 with the
 * words underneath). Hidden when the read returns no row; while loading a
 * 440px rounded skeleton holds the place and collapses only when the section
 * is dropped (the expand-outwards rule).
 *
 * PLAYBACK IS THE PAGE'S OWN. The lead registers with the SAME
 * registerRailVideo coordinator every Watch and All video uses, so the
 * 60%-visible rule and the one-playing-stream rule are the coordinator's,
 * not a second implementation; attachTileHls does the HLS/stream handling.
 * The mute button (upright only, as the mock draws it) toggles sound for this
 * card alone. The media tap opens the post in the existing fullscreen viewer
 * through openWithOrigin, exactly as a Watch row tap does.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Volume2, VolumeX } from 'lucide-react';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { autoplayBlocked } from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
import { registerRailVideo } from '@/components/explore-tab-new/courseled/mediaRailAutoplay';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { formatRelativeWithSeconds } from '@/i18n/format';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { getProfilePathById } from '@/lib/profileRoutes';
import { getThumbnailUrl } from '@/utils/thumbnail';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useWatchLead, type WatchLeadRow } from './useWatchLead';
import { leadCaption, leadKickerKey, leadShape } from './watchTopRules';
import { attachPosterPreview } from './posterPreview';

/** watch_lead_viewed fires once per session per lead post, at 50% visible. */
const VIEWED = new Set<string>();

/** Test-only: clears the session view set. The app never calls this. */
export function resetWatchLeadSessionForTests() {
  VIEWED.clear();
}

const TEXT_SHADOW = '0 1px 4px rgba(0,0,0,0.6)';

function leadHubRow(row: WatchLeadRow): HubRpcRow {
  return {
    post_id: row.post_id,
    post_content: row.caption,
    post_created_at: row.created_at,
    post_user_id: row.actor_type === 'personal' ? row.actor_id : null,
    post_actor_type: row.actor_type,
    post_actor_id: row.actor_id,
    actor_id: row.actor_id,
    actor_type: row.actor_type,
    media_type: 'video',
    media_url: row.media_url,
    poster_url: row.poster_url,
    hls_url: row.hls_url,
    stream_id: row.stream_id,
    duration_seconds: row.duration_seconds,
    width: row.width,
    height: row.height,
    creator_username: row.actor_type === 'personal' ? row.handle : null,
    creator_display_name: row.display_name,
    creator_avatar_url: row.avatar_url,
    creator_is_verified: row.is_verified,
    business_name: row.actor_type === 'business' ? row.display_name : null,
    business_logo_url: row.actor_type === 'business' ? row.avatar_url : null,
    business_is_verified: row.actor_type === 'business' ? row.is_verified : null,
    like_count: row.like_count,
    comment_count: row.comment_count,
    course_id: row.course_id,
    course_name: row.course_name,
  };
}

export function WatchLead({ userId, onDepart }: { userId: string | undefined; onDepart: () => void }) {
  const lead = useWatchLead(!!userId);
  if (!userId) return null;
  if (!lead.isFetched) {
    /* The skeleton only shrinks when the section is dropped. */
    return (
      <div
        data-watch-lead="skeleton"
        aria-hidden
        style={{ margin: '22px 16px 0', height: 440, borderRadius: 20, background: '#17171B' }}
      />
    );
  }
  if (lead.isError || !lead.data) return null;
  return <LeadCard row={lead.data} onDepart={onDepart} />;
}

function LeadCard({ row, onDepart }: { row: WatchLeadRow; onDepart: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const shape = leadShape(row.width, row.height);
  const upright = shape === 'upright';
  const kicker = leadKickerKey(row.reason);
  const caption = leadCaption(row.caption, row.course_name);
  const age = formatRelativeWithSeconds(row.created_at);
  const likes = t('amateur.watch.lead.likes', '{{count}} likes', { count: row.like_count });
  const course = row.course_name ? shortCourseName(row.course_name) : '';

  const poster = row.poster_url ?? (row.stream_id ? getThumbnailUrl({ streamId: row.stream_id, height: 720 }) : null);
  const hls = row.hls_url ?? (row.stream_id ? generateStreamHlsUrl(row.stream_id) : null);

  /* Muted autoplay in place through the page's one coordinator; the mute
     button toggles sound for this card only. */
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const mount = !!hls && !failed && !autoplayBlocked(reducedMotion);

  useEffect(() => {
    const el = hostRef.current;
    if (!mount || !el) return;
    return registerRailVideo(el, setActive);
  }, [mount]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !hls) return;
    video.muted = muted;
    const disposePreview = attachPosterPreview(video, poster, setPlaying);
    const attachment = attachTileHls(video, hls, () => setFailed(true));
    return () => {
      disposePreview();
      video.pause();
      attachment.detach();
    };
    // muted is applied live by the toggle below; re-attaching on every toggle
    // would restart the stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hls, poster]);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  /* watch_lead_viewed — once per session per post, at 50% visible. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || VIEWED.has(row.post_id)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !VIEWED.has(row.post_id)) {
            VIEWED.add(row.post_id);
            analyticsEvents.track('watch_lead_viewed', { reason: row.reason, shape });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [row.post_id, row.reason, shape]);

  const openPost = () => {
    analyticsEvents.track('watch_lead_opened', { reason: row.reason });
    onDepart();
    openWithOrigin({
      posts: toFeedPosts([leadHubRow(row)]),
      index: 0,
      originEl: null,
      posterUrl: poster,
      openedFrom: 'amateur-watch',
      forceStartAtZero: true,
    });
  };

  const openCreator = () => {
    navigate(
      row.actor_type === 'business'
        ? `/business/${row.handle || row.actor_id}`
        : getProfilePathById(row.actor_id, undefined, row.handle),
    );
  };

  const openCourse = () => {
    if (row.course_id) navigate(`/courses/${row.course_id}`);
  };

  const kickerLabel =
    kicker === 'new'
      ? t('amateur.watch.lead.kickerNew', 'New this week')
      : t('amateur.watch.lead.kickerLiked', 'Most liked this month');

  const kickerEl = (
    <span
      data-watch-lead="kicker"
      style={{
        position: 'absolute',
        left: 14,
        top: 14,
        zIndex: 3,
        height: 26,
        padding: '0 10px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: A.INK,
        pointerEvents: 'none',
      }}
    >
      {kickerLabel}
    </span>
  );

  const durationEl = (
    <span
      data-watch-lead="duration"
      style={{
        position: 'absolute',
        right: 12,
        ...(upright ? { top: 14 } : { bottom: 12 }),
        zIndex: 3,
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 7,
        padding: '3px 7px',
        fontSize: 12,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: A.INK,
        pointerEvents: 'none',
      }}
    >
      {formatDuration(row.duration_seconds)}
    </span>
  );

  const muteEl = upright ? (
    <button
      type="button"
      data-watch-lead="mute"
      aria-label={muted ? t('amateur.watch.lead.unmute', 'Unmute') : t('amateur.watch.lead.mute', 'Mute')}
      aria-pressed={!muted}
      onClick={(e) => {
        e.stopPropagation();
        toggleMute();
      }}
      style={{
        position: 'absolute',
        right: 12,
        bottom: 14,
        zIndex: 3,
        width: 34,
        height: 34,
        borderRadius: 999,
        border: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: A.INK,
        cursor: 'pointer',
      }}
    >
      {muted ? <VolumeX size={16} strokeWidth={2} /> : <Volume2 size={16} strokeWidth={2} />}
    </button>
  ) : null;

  const courseChip = (onDark: boolean) =>
    row.course_id && course ? (
      <button
        type="button"
        data-watch-lead="course"
        onClick={(e) => {
          e.stopPropagation();
          openCourse();
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          marginTop: 10,
          height: 26,
          padding: '0 10px',
          borderRadius: 999,
          border: 0,
          background: onDark ? 'rgba(255,255,255,0.16)' : '#1E1E23',
          color: onDark ? A.INK : 'rgba(248,250,252,0.78)',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: SANS,
          cursor: 'pointer',
        }}
      >
        <MapPin size={12} strokeWidth={2.2} aria-hidden />
        {course}
      </button>
    ) : null;

  const whoAvatar = (size: number) => (
    <SquircleAvatar
      src={row.avatar_url ?? undefined}
      alt={row.display_name}
      userId={row.actor_type === 'personal' ? row.actor_id : null}
      size={size}
      fallback={row.display_name.charAt(0)}
      hairlineRing
    />
  );

  return (
    <div
      ref={rootRef}
      data-watch-lead={shape}
      style={{ margin: '22px 16px 0', borderRadius: 20, overflow: 'hidden', position: 'relative', background: '#17171B', fontFamily: SANS }}
    >
      {/* THE MEDIA opens the post full screen, as a Watch row tap does. */}
      <div
        ref={hostRef}
        role="button"
        tabIndex={0}
        aria-label={caption ?? row.display_name}
        onClick={openPost}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPost();
          }
        }}
        style={{ position: 'relative', ...(upright ? { height: 440 } : { aspectRatio: '16 / 9' }), cursor: 'pointer', background: A.PANEL }}
      >
        {poster ? (
          <img src={poster} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
        {mount ? (
          <video
            ref={videoRef}
            poster={poster ?? undefined}
            muted={muted}
            playsInline
            preload="none"
            disableRemotePlayback
            tabIndex={-1}
            onError={(event) => {
              if (event.currentTarget.getAttribute('src')) setFailed(true);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: playing ? 1 : 0,
              transition: 'opacity 140ms linear',
              pointerEvents: 'none',
            }}
          />
        ) : null}
        {upright ? (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.8))',
              pointerEvents: 'none',
            }}
          />
        ) : null}
        {kickerEl}
        {durationEl}
        {muteEl}
        {upright ? (
          <div style={{ position: 'absolute', left: 14, right: 60, bottom: 16, zIndex: 2 }}>
            <button
              type="button"
              data-watch-lead="who"
              onClick={(e) => {
                e.stopPropagation();
                openCreator();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: 0,
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: SANS,
                color: A.INK,
              }}
            >
              {whoAvatar(30)}
              <span style={{ fontSize: 14, fontWeight: 600, textShadow: TEXT_SHADOW, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {row.display_name}
                {row.is_verified ? <VerifiedBadge size="sm" /> : null}
              </span>
            </button>
            {caption ? (
              <p
                data-watch-lead="caption"
                style={{
                  margin: '10px 0 0',
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                  color: A.INK,
                  textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {caption}
              </p>
            ) : null}
            <div data-watch-lead="meta" style={{ marginTop: 6, fontSize: 12, color: A.MUTE, textShadow: TEXT_SHADOW }}>
              {likes}
              {age ? ` · ${age}` : ''}
            </div>
            {courseChip(true)}
          </div>
        ) : null}
      </div>

      {upright ? null : (
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px 14px' }}>
          <button
            type="button"
            data-watch-lead="who"
            aria-label={row.display_name}
            onClick={openCreator}
            style={{ flex: 'none', padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
          >
            {whoAvatar(36)}
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            {caption ? (
              <p
                data-watch-lead="caption"
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: A.INK,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {caption}
              </p>
            ) : null}
            <div data-watch-lead="meta" style={{ marginTop: 3, fontSize: 12.5, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.display_name}
              {row.is_verified ? ' ✓' : ''}
              {` · ${likes}`}
              {age ? ` · ${age}` : ''}
            </div>
            {courseChip(false)}
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchLead;
