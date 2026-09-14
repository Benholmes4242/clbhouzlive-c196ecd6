import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { autoplayBlocked } from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
import { registerRailVideo } from '@/components/explore-tab-new/courseled/mediaRailAutoplay';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { RailChips } from '@/components/ui/RailChips';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { formatRelativeAgo } from '@/i18n/format';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { getThumbnailUrl } from '@/utils/thumbnail';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreShelf } from '../ExploreShelf';
import { ShelfRetry, ShelfShell } from '../ExploreShells';
import {
  WATCH_FILTERS,
  clipParams,
  isClipsOnly,
  railsWanted,
  videoParams,
  type WatchFilter,
} from './watchFilters';
import { useWatchClips } from './useWatchClips';
import { useWatchVideos } from './useWatchVideos';

/**
 * THE WATCH FEED (BRIEF_WATCH_MIXED_FEED).
 *
 * THE SHAPE TELLS YOU WHAT IT IS, and that is the whole layout rule:
 *   LONG-FORM VIDEO is full width and 16:9.
 *   A CLIP is 112px wide and 9:16, in a horizontal rail.
 *   A MOMENT is a 112px square, in a horizontal rail.
 * There are NO type labels and no "CLIP" badges anywhere in this file. A member
 * knows what a vertical thumbnail is; a badge would be the layout apologising
 * for itself.
 *
 * NO SEE-ALL ON ANY SECTION. A see-all implies a fuller list elsewhere, which
 * would make this page a summary of something rather than the thing itself. The
 * RAILS ARE WINDOWS INTO THE FEED: each repeat takes the NEXT window of rows,
 * never the first one again, and a member who wants more clips taps the Clips
 * chip and the whole page becomes clips.
 *
 * WATCH IS CLIENT-COMPOSED. It is not in the stream ranker's pool and this
 * brief does not change that.
 */

const INSET = 16;
/* BRIEF_EXPLORE_DEVICE_PASS §2b — THE CLIPS RAIL AGREES WITH EXPLORE'S.
   140 wide gives about 2.4 tiles at 390: clearly bigger than the old 112, and
   still a rail rather than a carousel of posters. Explore's ClipsShelf carries
   the same 140 x 249 so the two surfaces cannot drift. */
const CLIP_W = 140;

const MOMENT_W = 112;
const RAIL_WINDOW = 10;
/** Rails break the video run: after 2 videos, then every 4, alternating. */
const FIRST_RAIL_AFTER = 2;
const RAIL_EVERY = 4;

type RailKind = 'clips' | 'community';

function railKindAt(ordinal: number): RailKind {
  return ordinal % 2 === 0 ? 'clips' : 'community';
}

function videoTitle(row: HubRpcRow, fallback: string): string {
  const stripped = row.post_content ? stripMentionMarkup(String(row.post_content)).trim() : '';
  return stripped || row.course_name || fallback;
}

function creatorName(row: HubRpcRow): string {
  return (row.creator_display_name || row.creator_username || '').toString();
}

/**
 * THE POSTER IS DERIVED, NOT ASSUMED.
 *
 * MEASURED: both Watch RPCs DO return `poster_url` under that exact name, so
 * the field is not misnamed - but a real share of rows carry NULL in it, all of
 * them older `stream:<uid>` uploads whose poster was never written back. Every
 * one of those rows still carries `stream_id`, and Cloudflare Stream will serve
 * a frame for any uid, so the poster is derived from the stream rather than
 * left blank. Reading `poster_url` alone is what made those tiles black.
 */
function posterFor(row: HubRpcRow, height: number): string | null {
  if (row.poster_url) return row.poster_url;
  if (row.stream_id) return getThumbnailUrl({ streamId: row.stream_id, height });
  return null;
}

/** NEVER AN EMPTY BLACK RECTANGLE. When there is no poster and when a poster
 *  404s, the tile still reads as content: a soft gradient carrying the
 *  creator's initial, at the tile's own size. */
function PosterFallback({ initial, size }: { initial: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${A.PANEL} 0%, rgba(255,255,255,0.12) 100%)`,
        color: A.MUTE,
        fontFamily: SANS,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {initial}
    </span>
  );
}

/**
 * AUTOPLAY ON SCROLL — ONE STREAM ON THE PAGE, AND IT IS AN ENHANCEMENT
 * (BRIEF_EXPLORE_DEVICE_PASS §4).
 *
 * NOTHING NEW WAS WRITTEN TO COORDINATE THIS. The page already owns a
 * coordinator that does exactly what the brief asks: `mediaRailAutoplay`
 * registers every tile in ONE registry, elects the tile NEAREST THE CENTRE OF
 * THE VIEWPORT that is at least 60% visible, and gives it the only stream — so
 * two items can never play at once, and on a rail only the tile in the centre
 * plays. `reviewVideoAutoplay`'s coordinator was NOT reused here: its cap is two
 * per group, which is right for the mosaic and wrong for a scroll page.
 * `autoplayBlocked` (reduced motion, Save-Data) and `attachTileHls` are reused
 * verbatim.
 *
 * THE POSTER IS THE RESTING STATE. The video fades in over it once it actually
 * plays and is removed on the way out, so a blocked, failed or losing tile is a
 * poster and never a black rectangle. Muted always, no controls: the tap still
 * opens the post, where the real player and its mute affordance live.
 */
function AutoplayLayer({ hlsUrl, poster }: { hlsUrl: string | null; poster: string | null }) {
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const mount = !!hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  useEffect(() => {
    const el = hostRef.current;
    if (!mount || !el) return;
    return registerRailVideo(el, setActive);
  }, [mount]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !hlsUrl) return;
    const attachment = attachTileHls(video, hlsUrl, () => setFailed(true));
    video.muted = true;
    video.currentTime = 0;
    video.play()?.catch(() => setPlaying(false));
    return () => {
      setPlaying(false);
      video.pause();
      attachment.detach();
    };
  }, [active, hlsUrl]);

  if (!mount) return null;

  return (
    <span ref={hostRef} aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        preload="none"
        disableRemotePlayback
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={(event) => {
          if (event.currentTarget.getAttribute('src')) setFailed(true);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: playing ? 1 : 0,
          transition: 'opacity 140ms linear',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

/** The HLS source for a row, or null where the row carries no stream. */
function hlsFor(row: HubRpcRow): string | null {
  if (row.hls_url) return String(row.hls_url);
  if (row.stream_id) return generateStreamHlsUrl(String(row.stream_id));
  return null;
}


/** THE VIDEO — full-bleed width, 16:9, YouTube-shaped: a CIRCULAR 30px avatar.
 *  This is the one deliberate departure from the platform squircle standard,
 *  because a long-form video row is read as a video row and not as a member
 *  card. The brief rules it; every other avatar on Explore stays a squircle. */
function VideoCard({
  row,
  onPress,
}: {
  row: HubRpcRow;
  onPress: () => void;
}) {
  const { t } = useTranslation('courses');
  const title = videoTitle(row, t('amateur.watch.untitled', 'Untitled video'));
  const who = creatorName(row);
  const when = formatRelativeAgo(row.post_created_at ?? null);
  /* THE META LINE CARRIES NO VIEW COUNT. There is no per-post view figure on
     posts and neither Watch RPC returns one, so the figure is DROPPED rather
     than invented from likes or impressions. */
  const meta = [who, when].filter(Boolean).join(' \u00B7 ');
  const initial = (who || '?').trim().charAt(0).toUpperCase() || '?';
  const poster = posterFor(row, 720);
  const [posterFailed, setPosterFailed] = useState(false);


  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          background: A.PANEL,
        }}
      >
        {poster && !posterFailed ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPosterFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <PosterFallback initial={initial} size={34} />
        )}
        <GlassDurationBadge seconds={row.duration_seconds ?? null} />
      </div>

      <div style={{ display: 'flex', gap: 10, padding: `9px ${INSET}px 0`, alignItems: 'flex-start' }}>
        {row.creator_avatar_url ? (
          <img
            src={row.creator_avatar_url}
            alt=""
            loading="lazy"
            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: A.PANEL,
              color: A.MUTE,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initial}
          </span>
        )}
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.3,
              color: A.INK,
            }}
          >
            {title}
          </span>
          {meta ? (
            <span
              style={{
                display: 'block',
                marginTop: 3,
                fontSize: 11.5,
                fontWeight: 500,
                color: A.MUTE,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {meta}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

/** THE CLIP — 112 wide, 9:16, radius 10, duration chip, creator beneath. */
function ClipTile({ row, width, onPress }: { row: HubRpcRow; width?: number | string; onPress: () => void }) {
  const who = creatorName(row);
  const initial = (who || '?').trim().charAt(0).toUpperCase() || '?';
  const poster = posterFor(row, 480);
  const [posterFailed, setPosterFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: width ?? CLIP_W,
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: SANS,
      }}
    >
      <span
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          aspectRatio: '9 / 16',
          overflow: 'hidden',
          borderRadius: 10,
          background: A.PANEL,
        }}
      >
        {poster && !posterFailed ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPosterFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <PosterFallback initial={initial} size={20} />
        )}
        <AutoplayLayer hlsUrl={hlsFor(row)} poster={poster} />
        <GlassDurationBadge seconds={row.duration_seconds ?? null} />

      </span>
      {who ? (
        <span
          style={{
            display: 'block',
            marginTop: 6,
            fontSize: 11,
            fontWeight: 600,
            color: A.MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {who}
        </span>
      ) : null}
    </button>
  );
}

export function WatchFeed({ userId, onDepart }: { userId: string | undefined; onDepart: () => void }) {
  const { t } = useTranslation('courses');
  /* SESSION-SCOPED SELECTION: the chip resets to All on the next visit, so the
     page a member returns to is the page the page is meant to be. */
  const [filter, setFilter] = useState<WatchFilter>('all');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');

  /* THE SEARCH IS SERVER-SIDE. Both Watch RPCs already take p_search_query and
     match post content, creator display name, creator username and course name,
     so this searches EVERY row that qualifies - never only the page that
     happens to be loaded. */
  const search = query.trim().length >= 2 ? query.trim() : null;
  const searching = !!search;

  const vParams = videoParams(filter);
  const cParams = clipParams(filter);
  const videos = useWatchVideos({ userId, mode: vParams?.mode ?? null, search });
  const clips = useWatchClips({ userId, mode: cParams?.mode ?? null, filter: cParams?.filter, search });
  const rails = railsWanted(filter, searching);
  const moments = useMomentsOfTheWeek(30, { enabled: rails && !!userId, candidateLimit: 72 });

  const videoRows = useMemo(
    () => ((videos.data?.pages ?? []).flat() as HubRpcRow[]).filter((row) => !!row?.post_id),
    [videos.data],
  );
  const clipRows = useMemo(
    () => ((clips.data?.pages ?? []).flat() as HubRpcRow[]).filter((row) => !!row?.post_id),
    [clips.data],
  );
  const momentRows = useMemo(() => moments.data ?? [], [moments.data]);

  const videoPosts = useMemo(() => toFeedPosts(videoRows), [videoRows]);
  const clipPosts = useMemo(() => toFeedPosts(clipRows), [clipRows]);

  useEffect(() => {
    analyticsEvents.track('amateur_watch_filter_changed', { filter, searching });
  }, [filter, searching]);

  const openVideo = useCallback(
    (index: number) => {
      analyticsEvents.track('amateur_watch_tapped', { kind: 'video', filter });
      onDepart();
      openWithOrigin({
        posts: videoPosts,
        index,
        originEl: null,
        posterUrl: videoRows[index]?.poster_url ?? null,
        openedFrom: 'amateur-watch',
        forceStartAtZero: true,
      });
    },
    [filter, onDepart, videoPosts, videoRows],
  );

  /* THE RAIL IS THE DECK. Tapping a clip opens the viewer at that clip with the
     rail's own window as its deck, exactly as it does today. */
  const openClip = useCallback(
    (index: number) => {
      analyticsEvents.track('amateur_watch_tapped', { kind: 'clip', filter });
      onDepart();
      openWithOrigin({
        posts: clipPosts,
        index,
        originEl: null,
        posterUrl: clipRows[index]?.poster_url ?? null,
        openedFrom: 'amateur-clips',
        forceStartAtZero: true,
      });
    },
    [clipPosts, clipRows, filter, onDepart],
  );

  /* PAGINATION. One sentinel for the page: videos drive it on every mixed or
     video view, clips drive it where the page IS clips. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  /* Where the page IS clips, clips paginate it; everywhere else the videos do,
     and the rails top themselves up separately below. */
  const driver = isClipsOnly(filter) ? clips : vParams ? videos : clips;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !driver.hasNextPage || driver.isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void driver.fetchNextPage();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [driver]);

  /* THE RAILS KEEP THEIR OWN SUPPLY TOPPED UP. A rail that would reach past the
     loaded clip rows asks for the next page rather than repeating the first. */
  const railCount = rails ? Math.max(0, Math.ceil((videoRows.length - FIRST_RAIL_AFTER) / RAIL_EVERY)) : 0;
  const clipsNeeded = useMemo(() => {
    let n = 0;
    for (let i = 0; i < railCount; i += 1) if (railKindAt(i) === 'clips') n += 1;
    return n * RAIL_WINDOW;
  }, [railCount]);
  useEffect(() => {
    if (!rails) return;
    if (clipRows.length >= clipsNeeded) return;
    if (clips.hasNextPage && !clips.isFetchingNextPage) void clips.fetchNextPage();
  }, [rails, clipRows.length, clipsNeeded, clips]);

  const chips = useMemo(
    () =>
      WATCH_FILTERS.map((key) => ({
        id: key,
        label:
          key === 'all'
            ? t('amateur.watch.chip.all', 'All')
            : key === 'for_you'
              ? t('amateur.watch.chip.forYou', 'For you')
              : key === 'friends'
                ? t('amateur.watch.chip.friends', 'Friends')
                : key === 'your_courses'
                  ? t('amateur.watch.chip.yourCourses', 'Your courses')
                  : key === 'clips'
                    ? t('amateur.watch.chip.clips', 'Clips')
                    : t('amateur.watch.chip.videos', 'Videos'),
      })),
    [t],
  );

  const clipWindow = (ordinal: number): HubRpcRow[] => {
    let clipsBefore = 0;
    for (let i = 0; i < ordinal; i += 1) if (railKindAt(i) === 'clips') clipsBefore += 1;
    const start = clipsBefore * RAIL_WINDOW;
    return clipRows.slice(start, start + RAIL_WINDOW);
  };

  const momentWindow = (ordinal: number) => {
    let before = 0;
    for (let i = 0; i < ordinal; i += 1) if (railKindAt(i) === 'community') before += 1;
    const start = before * RAIL_WINDOW;
    return momentRows.slice(start, start + RAIL_WINDOW);
  };

  const clipsRail = (ordinal: number) => {
    /* ERRORED IS NOT EMPTY. A failed read shows its retry state; a settled empty
       window renders nothing at all. */
    if (clips.isError) {
      return (
        <ShelfRetry
          heading={t('amateur.watch.rail.clips', 'Clips')}
          label={t('amateur.stream.failed', 'This did not load.')}
          action={t('amateur.stream.retry', 'Try again')}
          onRetry={() => void clips.refetch()}
        />
      );
    }
    if (!clips.isFetched) return <ShelfShell tileW={CLIP_W} tileH={Math.round((CLIP_W * 16) / 9)} />;
    const window = clipWindow(ordinal);
    if (window.length === 0) return null;
    const offset = clipRows.indexOf(window[0]);
    return (
      <ExploreShelf heading={t('amateur.watch.rail.clips', 'Clips')} seeAllLabel={null}>
        {window.map((row, index) => (
          <div key={`clip:${row.post_id}:${row.media_id ?? index}`} style={{ flex: `0 0 ${CLIP_W}px` }}>
            <ClipTile row={row} onPress={() => openClip(offset + index)} />
          </div>
        ))}
      </ExploreShelf>
    );
  };

  const communityRail = (ordinal: number) => {
    if (moments.isError) {
      return (
        <ShelfRetry
          heading={t('amateur.watch.rail.community', 'From the community')}
          label={t('amateur.stream.failed', 'This did not load.')}
          action={t('amateur.stream.retry', 'Try again')}
          onRetry={() => void moments.refetch()}
        />
      );
    }
    if (!moments.isFetched) return <ShelfShell tileW={MOMENT_W} tileH={MOMENT_W} />;
    const window = momentWindow(ordinal);
    if (window.length === 0) return null;
    return (
      <ExploreShelf heading={t('amateur.watch.rail.community', 'From the community')} seeAllLabel={null}>
        {window.map((moment) => (
          <div key={`moment:${moment.key}`} style={{ flex: `0 0 ${MOMENT_W}px` }}>
            <div style={{ width: MOMENT_W, height: MOMENT_W }}>
              <MomentTile
                moment={moment}
                radius={10}
                initialsSize={14}
                labelSize={11}
                labelInset={8}
                labelled={false}
                autoplayGroup="amateur-watch-moments"
                /* THE TILE MUST CARRY ITS OWN BOX. Everything inside it is
                   absolutely positioned against the button, so a button with no
                   width or height collapsed and the picture never painted — the
                   square read as an empty box with the course name beneath. */
                style={{ width: '100%', height: '100%', display: 'block' }}

                onPress={() => {
                  analyticsEvents.track('amateur_watch_tapped', { kind: 'moment', filter });
                  onDepart();
                  openWithOrigin({
                    posts: [moment.post],
                    index: 0,
                    originEl: null,
                    posterUrl: moment.thumbnail,
                    mediaIndex: moment.mediaIndex ?? 0,
                    mediaId: moment.mediaId ?? null,
                    openedFrom: 'amateur-moments',
                    forceStartAtZero: true,
                  });
                }}
              />
            </div>
            {moment.courseName ? (
              <div
                style={{
                  marginTop: 6,
                  width: MOMENT_W,
                  fontSize: 11,
                  fontWeight: 600,
                  color: A.MUTE,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {moment.courseName}
              </div>
            ) : null}
          </div>
        ))}
      </ExploreShelf>
    );
  };

  /** THE CLIPS PAGE — 3-up vertical grid, nothing else. */
  const clipsGrid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        paddingInline: INSET,
      }}
    >
      {clipRows.map((row, index) => (
        <ClipTile
          key={`grid:${row.post_id}:${row.media_id ?? index}`}
          row={row}
          width="100%"
          onPress={() => openClip(index)}
        />
      ))}
    </div>
  );

  const videoList = videoRows.map((row, index) => {
    const ordinal = index >= FIRST_RAIL_AFTER && (index - FIRST_RAIL_AFTER) % RAIL_EVERY === 0
      ? (index - FIRST_RAIL_AFTER) / RAIL_EVERY
      : null;
    return (
      <div key={`video:${row.post_id}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 26 }}>
        <VideoCard row={row} onPress={() => openVideo(index)} />
        {rails && ordinal != null ? (
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            {railKindAt(ordinal) === 'clips' ? clipsRail(ordinal) : communityRail(ordinal)}
          </div>
        ) : null}
      </div>
    );
  });

  const videosSettled = !vParams || videos.isFetched;
  const clipsSettled = !cParams || clips.isFetched;
  const nothing =
    videosSettled &&
    clipsSettled &&
    videoRows.length === 0 &&
    clipRows.length === 0 &&
    !videos.isError &&
    !clips.isError;

  return (
    <div style={{ fontFamily: SANS }}>
      {/* SEARCH, then chips, then the feed. Results REPLACE the page - no route,
          no sheet - and the chips stay visible so All is always one tap away. */}
      <div style={{ paddingInline: INSET, paddingBottom: 12 }}>
        <input
          type="search"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setQuery(event.target.value);
          }}
          placeholder={t('amateur.watch.searchPlaceholder', 'Search videos, clips and creators')}
          aria-label={t('amateur.watch.searchPlaceholder', 'Search videos, clips and creators')}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            borderRadius: 11,
            border: `1px solid ${A.BORDER}`,
            background: 'rgba(255,255,255,0.06)',
            color: A.INK,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            outline: 'none',
          }}
        />
      </div>

      <div style={{ paddingInline: INSET, paddingBottom: 16 }}>
        <RailChips
          options={chips}
          value={filter}
          onChange={(next) => setFilter(next as WatchFilter)}
          ariaLabel={t('amateur.watch.filters', 'Watch filters')}
          ground="filled-selection"
        />
      </div>

      {videos.isError && vParams ? (
        <div style={{ paddingBottom: 26 }}>
          <ShelfRetry
            heading={t('amateur.watch.rail.videos', 'Videos')}
            label={t('amateur.stream.failed', 'This did not load.')}
            action={t('amateur.stream.retry', 'Try again')}
            onRetry={() => void videos.refetch()}
          />
        </div>
      ) : null}

      {isClipsOnly(filter) ? (
        <>
          {clips.isError ? (
            <ShelfRetry
              heading={t('amateur.watch.rail.clips', 'Clips')}
              label={t('amateur.stream.failed', 'This did not load.')}
              action={t('amateur.stream.retry', 'Try again')}
              onRetry={() => void clips.refetch()}
            />
          ) : (
            clipsGrid
          )}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 26 }}>
          {videoList}
          {/* A SEARCH THAT MATCHES CLIPS SHOWS THEM. The rails stand down while
              searching, so matching clips arrive as one grid beneath the
              matching videos rather than as a window into a feed. */}
          {searching && clipRows.length > 0 ? clipsGrid : null}
        </div>
      )}

      {nothing ? (
        <div style={{ paddingInline: INSET, paddingTop: 8 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: A.BODY }}>
            {searching
              ? t('amateur.watch.noResults', 'Nothing matches {{query}}.', { query: search })
              : t('amateur.watch.empty', 'Nothing to watch here yet.')}
          </p>
        </div>
      ) : null}

      {!videosSettled && videoRows.length === 0 && !isClipsOnly(filter) ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 26 }}>
          <ShelfShell tileW={320} tileH={180} />
          <ShelfShell tileW={320} tileH={180} />
        </div>
      ) : null}

      {driver.hasNextPage ? <div ref={sentinelRef} style={{ height: 1 }} /> : null}
    </div>
  );
}

export default WatchFeed;
