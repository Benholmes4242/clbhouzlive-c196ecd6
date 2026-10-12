import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import { useMomentsOfTheWeek, type Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { MomentsGrid } from '@/components/explore-tab-new/courseled/MomentsGrid';
import { RailChips } from '@/components/ui/RailChips';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';

import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';

import { ShelfRetry, ShelfShell } from '../ExploreShells';
import {
  WATCH_CHIPS,
  allOnly,
  clipParams,
  isCommunityOnly,
  showsLongForm,
  showsQuickHits,
  videoParams,
  type WatchFilter,
} from './watchFilters';
import {
  AutoplayLayer,
  PosterFallback,
  VideoCard,
  WatchProgressBar,
  creatorName,
  hlsFor,
  posterFor,
  videoTitle,
} from './videoUnit';
import { useWatchClips } from './useWatchClips';
import { useWatchVideos } from './useWatchVideos';
import { useWatchProgress, useWatchViews } from './useWatchSignals';
import {
  RAIL_EVERY,
  groupByMember,
  isPartWatched,
  isQuickHit,
  photosCaption,
  progressFraction,
  reasonLine,
  remainingLabel,
  spreadByCreator,
  viewsLabel,
} from './watchRules';

/**
 * THE WATCH PAGE (BRIEF_WATCH_PAGE; the signed-off prototype is the spec).
 *
 * ORDER (K.8): chips, then Continue watching (All only, only when populated)
 * -> Quick hits -> the long-form column, with the community rail injected once,
 * after the third long-form card.
 *
 * THE SHAPE IS THE TYPE. A video under QUICK_HIT_MAX is a portrait Quick Hit in
 * a rail; three minutes or more is full-width 16:9 long-form. Both reads are
 * fetched and split on duration alone, whichever RPC a row came from. No
 * "Quick hit" badge: the shape and the rail title already say it.
 *
 * K.7: every rail card is a top-aligned flex column with a fixed-height poster
 * (flex: none), because a <button> vertically centres its own contents.
 */

const INSET = 14;
const CW_W = 184;
const CW_H = 104;
const QH_W = 126;
const QH_H = 224;
const CT_W = 124;

const cardButton: React.CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  padding: 0,
  border: 0,
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: SANS,
  color: A.INK,
};

const clamp2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const oneLine: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

function Section({ title, kicker, onSeeAll, seeAll }: { title: string; kicker?: string; onSeeAll?: () => void; seeAll?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: `18px ${INSET}px 9px` }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: A.INK }}>
        {title}
        {kicker ? (
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM }}>
            {kicker}
          </span>
        ) : null}
      </h2>
      {onSeeAll ? (
        <button
          type="button"
          onClick={onSeeAll}
          style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 600, color: A.MUTE }}
        >
          {seeAll}
        </button>
      ) : null}
    </div>
  );
}

function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      data-watch-rail={label}
      style={{ display: 'flex', gap: 10, padding: `0 ${INSET}px 2px`, overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none', willChange: 'transform' }}
    >
      {children}
    </div>
  );
}

/** M.1 — Quick hits chip lays the same tile out as a 3-column grid; All keeps the rail. */
function QuickLayout({ grid, children }: { grid: boolean; children: React.ReactNode }) {
  if (!grid) return <Rail label="quick">{children}</Rail>;
  return (
    <div data-watch-grid="quick" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, alignItems: 'start', padding: `0 ${INSET}px 2px` }}>
      {children}
    </div>
  );
}

function Poster({ row, height, posterH, radius, autoplay, progress }: { row: HubRpcRow; height: number | null; posterH: number; radius: number; autoplay: boolean; progress: number | null }) {
  const poster = posterFor(row, posterH);
  const [failed, setFailed] = useState(false);
  const initial = (creatorName(row) || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span data-watch-frame style={{ display: 'block', position: 'relative', ...(height == null ? { aspectRatio: '9 / 16' } : { height }), flex: 'none', borderRadius: radius, overflow: 'hidden', background: A.PANEL }}>
      {poster && !failed ? (
        <img src={poster} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <PosterFallback initial={initial} size={20} />
      )}
      {autoplay ? <AutoplayLayer hlsUrl={hlsFor(row)} poster={poster} /> : null}
      <span style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <GlassDurationBadge seconds={row.duration_seconds ?? null} />
      </span>
      {progress != null ? <WatchProgressBar fraction={progress} /> : null}
    </span>
  );
}

export function WatchFeed({
  userId,
  onDepart,
  initialFilter = 'all',
  onOpenComments,
}: {
  userId: string | undefined;
  onDepart: () => void;
  /** Entry selection, e.g. Explore's community see-all opens on 'community'. */
  initialFilter?: WatchFilter;
  /** Opens ExploreMagazine's one mounted CommentsSheetV2 — never a second sheet here. */
  onOpenComments?: (postId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const [filter, setFilter] = useState<WatchFilter>(initialFilter);
  const [query, setQuery] = useState('');

  /* THE SEARCH IS SERVER-SIDE: both RPCs take p_search_query. */
  const search = query.trim().length >= 2 ? query.trim() : null;
  const searching = !!search;
  useEffect(() => {
    if (searching && filter === 'community') setFilter('all');
  }, [searching, filter]);

  const vParams = videoParams(filter);
  const cParams = clipParams(filter);
  const videos = useWatchVideos({ userId, mode: vParams?.mode ?? null, search });
  const clips = useWatchClips({ userId, mode: cParams?.mode ?? null, filter: cParams?.filter, search });
  const community = isCommunityOnly(filter);
  const onAll = allOnly(filter, searching);
  const moments = useMomentsOfTheWeek(30, { enabled: (onAll || community) && !!userId, candidateLimit: 72 });
  const progress = useWatchProgress(userId);
  const { data: myCourses } = useUserAnalyticsCourses({ enabled: !!userId });
  const playedIds = useMemo(
    () => new Set((myCourses ?? []).filter((c) => c.rounds_count > 0).map((c) => c.course_id)),
    [myCourses],
  );
  const onYourCourse = useCallback((row: HubRpcRow) => !!row.course_id && playedIds.has(row.course_id), [playedIds]);

  /* ONE POOL, SPLIT ON DURATION. A row is the same video whichever read it came from. */
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const out: HubRpcRow[] = [];
    for (const row of [...(videos.data?.pages ?? []).flat(), ...(clips.data?.pages ?? []).flat()] as HubRpcRow[]) {
      if (!row?.post_id || seen.has(row.post_id)) continue;
      seen.add(row.post_id);
      out.push(row);
    }
    return filter === 'your_courses' ? out.filter(onYourCourse) : out;
  }, [videos.data, clips.data, filter, onYourCourse]);

  const saved = progress.data;
  /* M.1 — one tile, two layouts: grid on the Quick hits chip, rail everywhere else. */
  const quickGrid = filter === 'quick';
  const quickRows = useMemo(() => (showsQuickHits(filter) ? rows.filter((r) => isQuickHit(r.duration_seconds)) : []), [rows, filter]);
  const longRows = useMemo(
    () =>
      showsLongForm(filter)
        ? spreadByCreator(
            rows.filter((r) => !isQuickHit(r.duration_seconds)),
            (r) => String(r.post_user_id ?? r.actor_id ?? creatorName(r)),
          )
        : [],
    [rows, filter],
  );
  const continueRows = useMemo(
    () => (onAll && saved ? rows.filter((r) => isPartWatched(r, saved.get(r.post_id))) : []),
    [onAll, rows, saved],
  );

  const views = useWatchViews(useMemo(() => [...quickRows, ...longRows].map((r) => r.post_id), [quickRows, longRows]));
  const viewsFor = (row: HubRpcRow) => (views.data ? viewsLabel(views.data.get(row.post_id) ?? 0) : null);
  const barFor = (row: HubRpcRow) => {
    const p = saved?.get(row.post_id);
    return isPartWatched(row, p) ? progressFraction(row, p) : null;
  };

  const quickPosts = useMemo(() => toFeedPosts(quickRows), [quickRows]);
  const longPosts = useMemo(() => toFeedPosts(longRows), [longRows]);
  /* L.2 — the like control lives on the long-form card (BRIEF_WATCH_VIDEO_ROW_REACTIONS). */
  const { activeActor } = useActiveActor();
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });
  const likeAvailable = !!userId && !!activeActor;
  const continuePosts = useMemo(() => toFeedPosts(continueRows), [continueRows]);

  useEffect(() => {
    analyticsEvents.track('amateur_watch_filter_changed', { filter, searching });
  }, [filter, searching]);

  const open = useCallback(
    (kind: 'video' | 'clip' | 'continue', posts: ReturnType<typeof toFeedPosts>, list: HubRpcRow[], index: number) => {
      analyticsEvents.track('amateur_watch_tapped', { kind, filter });
      onDepart();
      const row = list[index];
      const resume = saved?.get(row?.post_id ?? '');
      openWithOrigin({
        posts,
        index,
        originEl: null,
        posterUrl: row?.poster_url ?? null,
        openedFrom: kind === 'clip' ? 'amateur-clips' : 'amateur-watch',
        forceStartAtZero: true,
        /* K.1: a part-watched video resumes where the member left it. */
        resumeAtSeconds: row && isPartWatched(row, resume) ? resume?.position ?? null : null,
      });
    },
    [filter, onDepart, saved],
  );

  /* PAGINATION: one sentinel. Quick hits pages the clip read, every other view the long-form read. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const driver = filter === 'quick' ? clips : videos;
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

  const chipLabel = (key: (typeof WATCH_CHIPS)[number]) =>
    key === 'all'
      ? t('amateur.watch.chip.all', 'All')
      : key === 'quick'
        ? t('amateur.watch.chip.quick', 'Quick hits')
        : key === 'long'
          ? t('amateur.watch.chip.long', 'Long form')
          : key === 'friends'
            ? t('amateur.watch.chip.friends', 'Friends')
            : t('amateur.watch.chip.yourCourses', 'Your courses');
  const chips = WATCH_CHIPS.map((key) => ({ id: key, label: chipLabel(key) }));

  const openMoment = (moment: Moment) => {
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
  };

  /* K.6 — ONE ENTRY PER MEMBER, labelled with who, then where. */
  const members = useMemo(() => groupByMember(moments.data ?? [], (m) => m.post?.userId ?? null).slice(0, 10), [moments.data]);
  const communityRail = () => {
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
    if (!moments.isFetched) return <ShelfShell tileW={CT_W} tileH={CT_W} />;
    if (members.length === 0) return null;
    return (
      <div style={{ paddingBottom: 8 }}>
        <Section
          title={t('amateur.watch.rail.community', 'From the community')}
          seeAll={t('amateur.watch.seeAll', 'See all')}
          onSeeAll={() => {
            analyticsEvents.track('amateur_shelf_see_all', { kind: 'moments', surface: 'watch' });
            setFilter('community');
          }}
        />
        <Rail label="community">
          {members.map(({ lead, count }) => (
            <div key={`member:${lead.key}`} data-watch-card="community" style={{ ...cardButton, width: CT_W, cursor: 'default' }}>
              <div data-watch-frame style={{ width: CT_W, height: CT_W, flex: 'none', borderRadius: 11, overflow: 'hidden', position: 'relative' }}>
                <MomentTile
                  moment={lead}
                  radius={11}
                  initialsSize={14}
                  labelSize={11}
                  labelInset={8}
                  labelled={false}
                  autoplayGroup="amateur-watch-moments"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  onPress={() => openMoment(lead)}
                />
              </div>
              <span style={{ ...oneLine, marginTop: 7, fontSize: 12.5, fontWeight: 600 }}>{lead.post?.displayName || lead.post?.username}</span>
              <span style={{ ...oneLine, marginTop: 2, fontSize: 11.5, color: A.DIM }}>{photosCaption(lead.courseName, count)}</span>
            </div>
          ))}
        </Rail>
      </div>
    );
  };

  const settled = (!vParams || videos.isFetched) && (!cParams || clips.isFetched);
  const loading = !settled && rows.length === 0;
  const nothing = !community && settled && quickRows.length === 0 && longRows.length === 0 && !videos.isError && !clips.isError;

  return (
    <div style={{ fontFamily: SANS }}>
      {/* K.9: the search field is unchanged. */}
      <div style={{ paddingInline: 16, paddingBottom: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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

      <div style={{ paddingInline: 16, paddingBottom: 4 }}>
        <RailChips
          options={chips}
          value={filter}
          onChange={(next) => setFilter(next as WatchFilter)}
          ariaLabel={t('amateur.watch.filters', 'Watch filters')}
          ground="filled-selection"
        />
      </div>

      {community ? (
        moments.isError ? (
          <ShelfRetry
            heading={t('amateur.watch.rail.community', 'From the community')}
            label={t('amateur.stream.failed', 'This did not load.')}
            action={t('amateur.stream.retry', 'Try again')}
            onRetry={() => void moments.refetch()}
          />
        ) : !moments.isFetched ? (
          <ShelfShell tileW={320} tileH={240} />
        ) : (moments.data ?? []).length === 0 ? (
          <p style={{ margin: 0, padding: '8px 16px 0', fontSize: 14, lineHeight: 1.5, color: A.BODY }}>
            {t('amateur.watch.empty', 'Nothing to watch here yet.')}
          </p>
        ) : (
          <div style={{ paddingInline: 16, paddingTop: 12 }}>
            <MomentsGrid moments={moments.data ?? []} gap={4} tall={320} radius={10} autoplayGroup="amateur-watch-community" onTilePress={openMoment} />
          </div>
        )
      ) : (
        <>
          {/* K.2 — CONTINUE WATCHING: All only, only when something is part-watched. */}
          {continueRows.length > 0 ? (
            <>
              <Section title={t('amateur.watch.rail.continue', 'Continue watching')} />
              <Rail label="continue">
                {continueRows.map((row, index) => (
                  <button key={`cw:${row.post_id}`} type="button" data-watch-card="continue" onClick={() => open('continue', continuePosts, continueRows, index)} style={{ ...cardButton, width: CW_W }}>
                    <Poster row={row} height={CW_H} posterH={360} radius={10} autoplay={false} progress={barFor(row)} />
                    <span style={{ ...clamp2, marginTop: 7, fontSize: 12.5, fontWeight: 600, lineHeight: 1.32 }}>
                      {videoTitle(row, t('amateur.watch.untitled', 'Untitled video'))}
                    </span>
                    <span style={{ marginTop: 4, fontSize: 11.5, fontWeight: 700, color: A.AMBER }}>{remainingLabel(row, saved?.get(row.post_id))}</span>
                  </button>
                ))}
              </Rail>
            </>
          ) : null}

          {/* K.3 — QUICK HITS. No badge on the tiles. */}
          {clips.isError && quickRows.length === 0 && showsQuickHits(filter) ? (
            <ShelfRetry
              heading={t('amateur.watch.rail.quick', 'Quick hits')}
              label={t('amateur.stream.failed', 'This did not load.')}
              action={t('amateur.stream.retry', 'Try again')}
              onRetry={() => void clips.refetch()}
            />
          ) : quickRows.length > 0 ? (
            <>
              <Section
                title={t('amateur.watch.rail.quick', 'Quick hits')}
                kicker={t('amateur.watch.rail.quickKicker', 'Under 3 min')}
                /* M.1: no See all on the Quick hits chip; it would point at a worse version of this page. */
                seeAll={quickGrid ? undefined : t('amateur.watch.seeAll', 'See all')}
                onSeeAll={quickGrid ? undefined : () => {
                  analyticsEvents.track('amateur_shelf_see_all', { kind: 'clips', surface: 'watch' });
                  onDepart();
                  navigate('/watch/clips');
                }}
              />
              <QuickLayout grid={quickGrid}>
                {quickRows.map((row, index) => {
                  const who = creatorName(row);
                  const v = viewsFor(row);
                  return (
                    <button key={`qh:${row.post_id}`} type="button" data-watch-card="quick" onClick={() => open('clip', quickPosts, quickRows, index)} style={{ ...cardButton, width: quickGrid ? '100%' : QH_W, minWidth: 0 }}>
                      <Poster row={row} height={quickGrid ? null : QH_H} posterH={480} radius={12} autoplay progress={barFor(row)} />
                      <span style={{ ...clamp2, marginTop: 7, fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
                        {videoTitle(row, t('amateur.watch.untitled', 'Untitled video'))}
                      </span>
                      {who || v ? (
                        <span style={{ ...oneLine, marginTop: 3, fontSize: 11, color: A.DIM }}>{[who, v].filter(Boolean).join(' \u00B7 ')}</span>
                      ) : null}
                      {onYourCourse(row) && row.course_name ? (
                        <span style={{ ...oneLine, marginTop: 3, fontSize: 11, color: A.AMBER }}>{row.course_name}</span>
                      ) : null}
                    </button>
                  );
                })}
              </QuickLayout>
            </>
          ) : loading && showsQuickHits(filter) ? (
            <div style={{ paddingTop: 18 }}>
              <ShelfShell tileW={QH_W} tileH={QH_H} />
            </div>
          ) : null}

          {/* K.4 — THE LONG-FORM COLUMN, with the community rail once after the third card. */}
          {videos.isError && showsLongForm(filter) ? (
            <div style={{ paddingTop: 18 }}>
              <ShelfRetry
                heading={t('amateur.watch.rail.videos', 'Videos')}
                label={t('amateur.stream.failed', 'This did not load.')}
                action={t('amateur.stream.retry', 'Try again')}
                onRetry={() => void videos.refetch()}
              />
            </div>
          ) : null}
          {longRows.length > 0 ? (
            <>
              <Section title={filter === 'your_courses' ? t('amateur.watch.rail.fromYourCourses', 'From your courses') : t('amateur.watch.rail.watch', 'Watch')} />
              {longRows.map((row, index) => {
                const p = saved?.get(row.post_id);
                const part = isPartWatched(row, p);
                return (
                  <div key={`lf:${row.post_id}`} style={{ marginBottom: 4 }}>
                    <VideoCard
                      row={row}
                      onPress={() => open('video', longPosts, longRows, index)}
                      views={viewsFor(row)}
                      progress={barFor(row)}
                      reason={reasonLine({
                        partWatched: part,
                        remaining: remainingLabel(row, p),
                        courseName: row.course_name,
                        onYourCourse: onYourCourse(row),
                        fromFollowed: row.creator_relation === 'following' || row.creator_relation === 'friend',
                      })}
                      engagement={(() => {
                        /* longPosts[index] is 1:1 with longRows[index] (load-bearing). */
                        const post = longPosts[index] ?? null;
                        const like = getActiveLikeState(post);
                        return {
                          likeAvailable,
                          liked: like.isLiked,
                          likeCount: like.count,
                          own: !!userId && (row.post_user_id ?? row.actor_id) === userId,
                          onToggleLike: () => handleLike(post),
                          commentCount: Number(row.comment_count ?? 0),
                          onOpenComments: () => onOpenComments?.(row.post_id),
                        };
                      })()}
                    />
                    {onAll && index + 1 === RAIL_EVERY && index + 1 < longRows.length ? communityRail() : null}
                  </div>
                );
              })}
            </>
          ) : null}

          {nothing ? (
            <p style={{ margin: 0, padding: '30px 24px', textAlign: 'center', fontSize: 13.5, lineHeight: 1.5, color: A.MUTE }}>
              {t('amateur.watch.emptyFilter', 'Nothing here yet. Try another filter.')}
            </p>
          ) : null}
        </>
      )}

      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
    </div>
  );
}

export default WatchFeed;
