import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MediaRailTile } from '@/components/explore-tab-new/courseled/MediaRailTile';
import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import { useDiscoverMediaPreview } from '@/components/explore-tab-new/courseled/hooks/useDiscoverMediaPreview';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { RailChips } from '@/components/ui/RailChips';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import {
  RoundDetailSheet,
  type RoundDetailSeed,
} from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useQueryClient } from '@tanstack/react-query';
import { whsKeys } from '@/lib/whs/hooks';
import { fetchRoundDetail } from '@/lib/whs/api';
import { coursePlaceLine } from './placeLine';
import {
  pageDecision, rubberBand, neighbours, shouldExtend, openCue, noteHintPaged,
  dragNeighbour, resetHint,
} from './roundPaging';
import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';
import { runNudge } from './roundNudge';
import { scrollElementIntoView, scrollPageToTop } from '@/lib/getScrollParent';
import { rememberAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import StickySafeAreaScrim, { useStickySafeAreaState } from '@/components/chrome/StickySafeAreaScrim';
import { Z } from '@/config/zIndex';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreCard, type CardSize } from './ExploreCard';
import { monthLabel } from './exploreCopy';
import { ExploreShelf } from './ExploreShelf';
import { useCircleSize } from '@/features/amateur/useCircleSize';

import { CircleShelf } from './CircleShelf';
import { StandingShelf } from './StandingShelf';
import { LeadShell, PairShell, ShelfRetry, ShelfShell, StdShell } from './ExploreShells';
import { listCourseEvents } from './listCourseEvents';
import {
  EXPLORE_VIEWS,
  SCOPED_VIEWS,
  readExploreView,
  writeExploreView,
  type ExploreView,
} from './exploreViewMemory';
import { STREAM_PAGE_SIZE, scoreItem, useExploreStreamClient } from './useExploreStreamClient';
import { EXPLORE_SERVER_STREAM_ENABLED } from './serverStreamSwitch';
import { WatchFeed } from './watch/WatchFeed';
import { VideoCard } from './watch/videoUnit';
import { useWatchVideos } from './watch/useWatchVideos';
import { toFeedPosts, type HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { useExploreStream } from './useExploreStream';
import { dedupeItems, warnDuplicates } from './dedupeStream';
import type { StreamItem } from './streamItem';
import { WeeklyClubShelf } from './WeeklyClubShelf';
import { CourseShelf } from './CourseShelf';
import { PeopleShelf } from './PeopleShelf';
import { useCountyCourses, useListCourses, useWorldTop100Courses } from './useCourseShelves';
import { useRecentCourseRatings, useScopeCourses } from './useCoursesView';
import { useViewerScoreScope, type ScoreScope } from './useViewerScoreScope';
import { useViewerStanding, type StandingRow } from './useViewerStanding';
import { applyRankCardRule } from './rankCards';
import { cardTreatments, earnsHeroTreatment } from './cardTreatment';
import { shelfDueAt, shelfForOrdinal } from './shelfCadence';
/* BRIEF_COURSES_MERGED — Courses and Reviews are ONE view. */
import { useCourseCandidateIndex } from './useCourseCandidateIndex';
import { useCourseResults } from './useCourseResults';
import { useCircleCourseIds, circleCourseIds, useMergedCourseShelves } from './useMergedCourseShelves';
import { searchCourses, placeTree, placeCourseIds, type PlaceChoice } from './coursesSearch';
import { CoursesSearchField } from './CoursesSearchField';
import { RegionDropdown } from './RegionDropdown';

import { useViewerCourseBests } from './useViewerCourseBests';

/**
 * THE MAGAZINE (BRIEF_EXPLORE_MAGAZINE, PHASE A).
 *
 * One ranked stream of ONE UNIT, broken by a shelf every fourth card. The page
 * owns NO header: /amateur wears the shared floating glass islands (registry
 * rule), exactly as it did before.
 *
 * THREE CHIPS THROUGH PHASE B2. Courses and Reviews remain absent rather than
 * disabled; a control that cannot change what you see does not render.
 *
 * SHELVES PRESENT IN PHASE A are clips and moments — the two whose sources ship
 * today with no geography and no standing behind them. The rounds, standing,
 * people and course shelves are Phase B/C, and an absent shelf is SKIPPED with
 * no gap, which is the same code path an empty one takes.
 */

/** §3d cards are inset 12px from the viewport edge — objects, not text. The
 *  20px section gutter belongs to text sections and is not used here. */
const CARD_INSET = 12;
/** §3d blocks are 26px apart. */
const BLOCK_GAP = 26;

/* THE CLIP TILE (BRIEF_EXPLORE_DEVICE_PASS §2b). ~2.4 tiles visible at 390:
   140 wide keeps a 9:16 clip at 249 tall, which is clearly bigger than the old
   118 and still reads as a RAIL rather than a carousel of posters. The Watch
   clips rail carries the same 140 so the two surfaces agree. */
const CLIP_TILE = { w: 140, h: 249 };

const MOMENT_TILE = { w: 132, h: 132 };

/* THE VIDEO TILE (BRIEF_EXPLORE_ALL_VIDEO §1). LANDSCAPE, because that is what
   tells a member this is not a clip: 200 wide at 16:9 is a 113 photo, about 1.8
   tiles at 390, and it can never be mistaken for the 140x249 clip beside it. */
const VIDEO_TILE = { w: 200, h: 113 };

/** §3e PHASE C — THE FINAL ALL ORDER, skipping empties: clips, rounds (this week
 *  at the club), standing, courses:county, moments, people, courses:world,
 *  courses:list. An empty or unresolved shelf renders nothing and leaves no gap,
 *  which is the same path an empty clips shelf already takes. */
type ShelfKind =
  | 'clips'
  /** BRIEF_EXPLORE_ALL_VIDEO §1 — long-form video on All, landscape tiles, NO
   *  see-all (a member wanting more taps Watch). */
  | 'videos'
  | 'clubWeek'
  /** BRIEF_EXPLORE_CIRCLE_SHELF — latest rounds from the people you follow,
   *  newest first. Fixed once at the top of Scores; absent from All, Courses and Watch. */
  | 'circle'
  | 'standing'
  | 'coursesCounty'
  | 'moments'
  | 'people'
  | 'coursesWorld'
  | 'coursesList'
  /** §5b PHASE C C3 — courses:top-rated, the one NEW shelf of this step. The
   *  county and world course shelves already exist from C1 and are REUSED. */
  | 'coursesTopRated'
  /** BRIEF_COURSES_MERGED §4 — the merged view's four NEW rails. Seven distinct
   *  rails run through its breaks and none repeats within a session. */
  | 'coursesLeadRated'
  | 'coursesCircle'
  | 'coursesWorthDrive'
  | 'coursesNew';

type Block =
  | { kind: 'lead'; item: StreamItem }
  | { kind: 'std'; item: StreamItem }
  | { kind: 'pair'; items: [StreamItem, StreamItem] }
  | { kind: 'shelf'; shelf: ShelfKind };

/** §6d PAIRS carry no round shape, so only kinds that never draw one pair up. */
const PAIRABLE = new Set(['review', 'course', 'story']);

/** SCORES ONLY — A BARE ROUND MAY PAIR. DO NOT HARMONISE THIS WITH ALL.
 *
 *  On All, a round card's shape is often the point, so the rule above stands
 *  there unchanged. On the rounds-only view the failure mode is twelve
 *  identical full-width cards, and a round with NO CONSEQUENCE is exactly the
 *  card whose line was earned on travel with nothing to mark — a pair draws no
 *  trace anyway (SHAPE_W.pair is 0), so the trace is not the loss it looks
 *  like. Measured: an all-bare page of 12 falls from ~3,240px to a lead plus
 *  five pair rows at ~1,275px, and records and circle rounds keep full width
 *  so the strong cards read AS strong.
 *
 *  The test is CONSEQUENCE ALONE, not consequence-and-no-visual: the visual
 *  form of the test would have fired on about 3% of rounds and changed
 *  nothing. */
function pairableRound(item: StreamItem): boolean {
  return item.kind === 'round' && item.consequence == null;
}

/** §5 shelves are inserted after card positions 3, 7, 11 ... An empty source
 *  consumes its scheduled slot without moving the next shelf earlier.
 *
 *  §5b/§5c A SINGLE-TYPE VIEW PAIRS ITS OWN KIND. The mixed stream refuses two
 *  cards of the same kind side by side, because there it would read as one
 *  repeated card; the Courses and Reviews views are all one kind by definition
 *  and the brief allows pairs in both, so `sameKindPairs` opens that door for
 *  those two views only. */
function buildBlocks(
  items: StreamItem[],
  shelves: ShelfKind[],
  sameKindPairs = false,
  opts: { bareRoundPairs?: boolean; shelfAt?: number[]; mergedCourses?: boolean; repeatShelves?: boolean } = {},
): Block[] {
  const blocks: Block[] = [];
  let cards = 0;
  let nextShelf = 0;
  let index = 0;
  /* BRIEF_COURSES_MERGED §3 THE MERGED VIEW'S THREE RHYTHMS. Full width for
     anything with something to say - EVERY review, and any course card whose
     headline is a real EVENT. Two-up for the quiet ones: a course card whose
     headline is a STABLE FACT. This is the SAME pairing path (sameKindPairs),
     narrowed by what the card has to say - not a second one. */
  const stableCourse = (item: StreamItem) => item.kind === 'course' && (item.facts.course_event ?? 'stable') === 'stable';
  const canPair = (item: StreamItem) =>
    !earnsHeroTreatment(item) && (
      opts.mergedCourses === true
        ? stableCourse(item)
        : PAIRABLE.has(item.kind) || (opts.bareRoundPairs === true && pairableRound(item))
    );

  while (index < items.length) {
    const item = items[index];
    const next = items[index + 1];

    if (cards === 0) {
      blocks.push({ kind: 'lead', item });
      index += 1;
      cards += 1;
    } else if (
      next &&
      canPair(item) &&
      canPair(next) &&
      (sameKindPairs || opts.mergedCourses === true || item.kind !== next.kind || (opts.bareRoundPairs === true && item.kind === 'round'))
    ) {
      blocks.push({ kind: 'pair', items: [item, next] });
      index += 2;
      cards += 2;
    } else {
      blocks.push({ kind: 'std', item });
      index += 1;
      cards += 1;
    }

    /* The standard rhythm is 3 / 7 / 11. A caller may supply finite custom
       boundaries; repeating views wrap their declared shelf order. */
    const shelf = shelfForOrdinal(shelves, nextShelf, opts.repeatShelves === true);
    const due = opts.shelfAt ? opts.shelfAt[nextShelf] : shelfDueAt(nextShelf);
    if (shelf != null && due != null && cards >= due) {
      blocks.push({ kind: 'shelf', shelf });
      nextShelf += 1;
    }
  }
  return blocks;
}

function ClipsShelf({ pos, onDepart }: { pos: number; onDepart: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const media = useDiscoverMediaPreview(true);
  const clips = useMemo(() => (media.data?.clips ?? []).slice(0, 12), [media.data]);

  if (!media.isFetched && !media.isError) return <ShelfShell tileW={CLIP_TILE.w} tileH={CLIP_TILE.h} />;
  /* §5b ERRORED IS NOT EMPTY. A failed read shows its state and offers the read
     again; a settled-empty read still renders nothing. */
  if (media.isError) {
    return (
      <ShelfRetry
        heading={t('amateur.stream.shelf.clips', 'Clips')}
        label={t('amateur.stream.failed', 'This did not load.')}
        action={t('amateur.stream.retry', 'Try again')}
        onRetry={() => void media.refetch()}
      />
    );
  }
  if (clips.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.stream.shelf.clips', 'Clips')}
      seeAllLabel={t('amateur.stream.seeAllClips', 'See all {{count}} clips', { count: clips.length })}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'clips', pos })}
      onSeeAll={() => {
        analyticsEvents.track('amateur_shelf_see_all', { kind: 'clips' });
        onDepart();
        navigate('/media?kind=clips');
      }}
    >
      {clips.map((clip, index) => (
        <div key={clip.key} style={{ flex: `0 0 ${CLIP_TILE.w}px` }}>
          <MediaRailTile
            item={clip}
            index={index}
            width={CLIP_TILE.w}
            aspect="9 / 16"
            autoplayGroup="amateur-magazine"
            onPress={() => {
              analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'clips', pos });
              onDepart();
              openWithOrigin({
                posts: clips.map((entry) => entry.post),
                index,
                originEl: null,
                posterUrl: clip.thumbnail,
                mediaIndex: clip.mediaIndex ?? 0,
                mediaId: clip.mediaId ?? null,
                openedFrom: 'amateur-clips',
                forceStartAtZero: true,
              });
            }}
          />
        </div>
      ))}
    </ExploreShelf>
  );
}

/**
 * THE VIDEOS RAIL (BRIEF_EXPLORE_ALL_VIDEO §1).
 *
 * ONE SOURCE, ONE UNIT. The rows are the Watch long-form read
 * (useWatchVideos, mode 'latest') under the SAME query key Watch's All chip
 * uses, so the two surfaces share one cache entry and no second read is
 * issued; the tile is Watch's own VideoCard at rail size, so no third video
 * tile exists. The rows are passed in because the page also merges them into
 * the stream (§2) - asking twice would be two reads for one fact.
 *
 * NO SEE-ALL, consistent with Watch: the rail is a window into the feed, not a
 * preview of a list.
 */
function VideosShelf({
  rows,
  isFetched,
  isError,
  onRetry,
  pos,
  onDepart,
}: {
  rows: HubRpcRow[];
  isFetched: boolean;
  isError: boolean;
  onRetry: () => void;
  pos: number;
  onDepart: () => void;
}) {
  const { t } = useTranslation('courses');
  const tiles = useMemo(() => rows.slice(0, 12), [rows]);
  const posts = useMemo(() => toFeedPosts(tiles), [tiles]);

  if (!isFetched && !isError) return <ShelfShell tileW={VIDEO_TILE.w} tileH={VIDEO_TILE.h} />;
  /* ERRORED IS NOT EMPTY - the same two gates every other shelf carries. */
  if (isError) {
    return (
      <ShelfRetry
        heading={t('amateur.stream.shelf.videos', 'Videos')}
        label={t('amateur.stream.failed', 'This did not load.')}
        action={t('amateur.stream.retry', 'Try again')}
        onRetry={onRetry}
      />
    );
  }
  if (tiles.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.stream.shelf.videos', 'Videos')}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'videos', pos })}
    >
      {tiles.map((row, index) => (
        <div key={row.post_id} style={{ flex: `0 0 ${VIDEO_TILE.w}px`, width: VIDEO_TILE.w }}>
          <VideoCard
            row={row}
            size="rail"
            context="all"
            onPress={() => {
              analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'videos', pos });
              onDepart();
              openWithOrigin({
                posts,
                index,
                originEl: null,
                posterUrl: row.poster_url ?? null,
                openedFrom: 'amateur-watch',
                forceStartAtZero: true,
              });
            }}
          />
        </div>
      ))}
    </ExploreShelf>
  );
}

function MomentsShelf({ pos, onDepart }: { pos: number; onDepart: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const moments = useMomentsOfTheWeek(30, { enabled: true, candidateLimit: 72 });
  const tiles = useMemo(() => (moments.data ?? []).slice(0, 12), [moments.data]);

  if (!moments.isFetched && !moments.isError) return <ShelfShell tileW={MOMENT_TILE.w} tileH={MOMENT_TILE.h} />;
  /* §5b ERRORED IS NOT EMPTY - see ClipsShelf. */
  if (moments.isError) {
    return (
      <ShelfRetry
        heading={t('amateur.stream.shelf.moments', 'From the community')}
        label={t('amateur.stream.failed', 'This did not load.')}
        action={t('amateur.stream.retry', 'Try again')}
        onRetry={() => void moments.refetch()}
      />
    );
  }
  if (tiles.length === 0) return null;

  return (
    <ExploreShelf
      heading={t('amateur.stream.shelf.moments', 'From the community')}
      seeAllLabel={t('amateur.stream.seeAllMoments', 'See all {{count}} moments', { count: tiles.length })}
      onSeen={() => analyticsEvents.track('amateur_shelf_seen', { kind: 'moments', pos })}
      onSeeAll={() => {
        analyticsEvents.track('amateur_shelf_see_all', { kind: 'moments' });
        onDepart();
        navigate('/media?kind=community');
      }}
    >
      {tiles.map((moment) => (
        <div key={moment.key} style={{ flex: `0 0 ${MOMENT_TILE.w}px`, width: MOMENT_TILE.w, height: MOMENT_TILE.h }}>
          <MomentTile
            moment={moment}
            radius={14}
            initialsSize={18}
            labelSize={10}
            labelInset={8}
            autoplayGroup="amateur-magazine-moments"
            autoplay={false}
            onPress={(tapped) => {
              analyticsEvents.track('amateur_shelf_tile_tapped', { kind: 'moments', pos });
              onDepart();
              openWithOrigin({
                posts: tiles.map((entry) => entry.post),
                index: Math.max(0, tiles.findIndex((entry) => entry.key === tapped.key)),
                originEl: null,
                posterUrl: tapped.thumbnail,
                mediaIndex: tapped.mediaIndex ?? 0,
                mediaId: tapped.mediaId ?? null,
                openedFrom: 'amateur-moments',
                forceStartAtZero: true,
              });
            }}
            style={{ width: MOMENT_TILE.w, height: MOMENT_TILE.h }}
          />
        </div>
      ))}
    </ExploreShelf>
  );
}

export function ExploreMagazine({ userId }: { userId: string | undefined }) {
  const { sentinelRef: chipSentinelRef, stuck: chipsStuck } = useStickySafeAreaState();
  const { t, i18n } = useTranslation('courses');
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const queryClient = useQueryClient();
  /* BRIEF_ROUND_SHEET §1.2 — THE TAPPED CARD STAYS VISIBLE ABOVE THE SHEET.
     One ref per rendered card, keyed on the stream item id, plus the id of the
     card currently ringed. The ring goes on close. */
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const chipBarRef = useRef<HTMLDivElement | null>(null);
  const [ringId, setRingId] = useState<string | null>(null);
  const [sheetSeed, setSheetSeed] = useState<RoundDetailSeed | null>(null);
  /* §3 — the sheet's own session: when it opened, how deep it went, and whether
     the depth section was read. rounds_viewed is 1 until paging lands (part 2). */
  const sheetSession = useRef<{ at: number; maxDetent: 'mid' | 'full'; rounds: number; stats: boolean } | null>(null);

  /*
   * BRIEF_ROUND_SHEET_CUES §5 — THE FEED FOLLOWS THE SHEET AGAIN.
   *
   * THE WINDOW IS NOT THE SCROLLER ON THIS APP. index.css gives html AND body
   * `height: 100%`, and #root `height: 100dvh; overflow-y: auto`, so the element
   * that actually scrolls the page is #root. Measured in the browser: with 3000px
   * of content appended, `#root.scrollHeight` is 3774 while both
   * `document.body.scrollHeight` and `document.documentElement.scrollHeight` stay
   * at the viewport height and `window.scrollY` never leaves 0. So the old
   * `window.scrollTo` here was a NO-OP on every open, first or not, which is
   * exactly what the device screenshot showed: the sheet on a different round
   * from the feed behind it, and no ring in view.
   *
   * Fixed at the cause, and with the resolver the app already owns
   * (`getScrollParent`), so this cannot drift from the rest of the page's own
   * scroll memory: it walks up from the card to the real scroll owner.
   */
  const revealCard = useCallback((id: string) => {
    const el = cardRefs.current.get(id);
    if (!el) return;
    const bar = chipBarRef.current?.getBoundingClientRect();
    const chrome = (bar?.height ?? 0) + (bar?.top ?? 0) + 8;
    scrollElementIntoView(el, { offset: Math.max(56, chrome), behavior: 'smooth' });
  }, []);

  /* §1.2 — the ring is an OUTLINE, so it cannot move the card by a pixel. */
  const ringStyle = (id: string): React.CSSProperties =>
    ringId === id
      ? { borderRadius: 14, outline: '2px solid rgba(248,250,252,0.55)', outlineOffset: 0 }
      : {};

  const prefetchRound = useCallback(
    (scoreId: string | null | undefined) => {
      if (!scoreId) return;
      void queryClient.prefetchQuery({
        queryKey: whsKeys.roundDetail(scoreId),
        queryFn: () => fetchRoundDetail(scoreId),
      });
    },
    [queryClient],
  );
  /* THE SETTLED FOLLOW-SET READ behind the circle slot's two occupants. One
     definition (src/lib/social/circle.ts), so this gate and the circle shelf's
     own rows can never disagree. */
  const circleSize = useCircleSize(userId, !!userId);
  const openReview = useReviewSheetStore((state) => state.open);

  const [view, setView] = useState<ExploreView>(() => readExploreView());
  const geography = useViewerScoreScope(userId);
  /* §1 ONE SCOPE ROW, ONE COMPONENT, TWO VIEWS. Scores and the merged Courses
     view read the SAME shared geography resolver; All and Watch never show the
     row. Scores' own default is My club where it resolves, else the county.
     BRIEF_COURSES_MERGED §5: THE TWO VIEWS NO LONGER SHARE THE SAME VOCABULARY.
     "My club" is retired FROM COURSES ONLY - on a browse it means one or two
     courses the member knows better than anybody. Scores keeps it, where it
     means rounds at the club's course, which is a real set. So the two views
     hold their own scope state rather than one being clamped into the other. */
  /** SCOPED_VIEWS is still the register of views that carry a scope row; the two
   *  rows are now built separately because their vocabularies differ (§5). */
  const scoped = SCOPED_VIEWS.includes(view);
  void scoped;
  const [scoreScope, setScoreScope] = useState<ScoreScope>('world');
  const scoreScopeChosen = useRef(false);
  useEffect(() => {
    if (view !== 'scores' || !geography.isFetched || scoreScopeChosen.current) return;
    setScoreScope(geography.scope.primaryClubId ? 'club' : geography.scope.county ? 'county' : 'world');
    scoreScopeChosen.current = true;
  }, [view, geography.isFetched, geography.scope.primaryClubId, geography.scope.county]);

  /* §5 MY CIRCLE IS STILL OFFERED, WORLD IS THE LANDING SCOPE (Ben, Sep 2026).
     Courses opens on World for every member and stays there until they pick
     another chip - no effect switches it after the page has rendered, so there
     is no scope jump on load. The chip is ABSENT for a member who follows
     nobody (hasCircle keeps deciding that), leaving World, county and country.
     Scores' own default is My club where it resolves, else the county. */
  const [coursesScope, setCoursesScope] = useState<ScoreScope>('world');
  const hasCircle = circleSize.isSuccess && !circleSize.isFetching && (circleSize.data ?? 0) > 0;

  /** The scope the VIEW ON SCREEN is looking at. */
  const activeScope: ScoreScope = view === 'courses' ? coursesScope : scoreScope;

  /* §6, §7 SEARCH AND PLACE. Both REPLACE THE PAGE BODY and neither is a route
     or a sheet, so the chips, the field and the scope row all stay mounted -
     that is the member's way back. */
  const [search, setSearch] = useState('');
  const [place, setPlace] = useState<PlaceChoice | null>(null);
  const query = search.trim();
  const filtering = view === 'courses' && (query.length >= 2 || place !== null);

  const [revealed, setRevealed] = useState(STREAM_PAGE_SIZE);
  /* §5c THE CLIENT RANKER IS OFF THE PAGE PATH. It is DEAD-LISTED, not deleted:
     it stays as the reference model for the scoring the RPC ports, and as the
     rollback. THE SAFETY NET STAYS WIRED - `fallbackWanted` below re-enables the
     whole composition the moment the RPC read is unavailable, so a failing RPC
     falls back to cards rather than to a blank page. Watch is never on the RPC,
     so Watch always composes here.
     The consequence and standing HOOKS it calls are NOT retired: consequences,
     useViewerStanding, useViewerCourseBests, useCourseRecordSignal,
     useViewerScoreScope and useRoundHoleShapes are all still read by this page,
     its shelves and its cards. */
  /* PHASE D3 THE SERVER RANKER: All, Scores, Courses and Reviews. WATCH IS NOT
     ON THE RPC - its clips and long-form video are not in the ranker's pool, so
     it stays client-composed with its current finite depth. The viewer id is
     withheld on Watch so the read is never even issued.
     A SCOPED VIEW WAITS FOR ITS GEOGRAPHY: asking before the shared resolver
     settles would send a null club and read as "no cards at your club".
     Until Ben runs docs/sql/explore_stream_d3.sql the non-All views error,
     `unavailable` is true, and the accepted client composition below stays in
     charge - the fallback is deliberate and is never an empty page. */
  /* THE SWITCH (serverStreamSwitch.ts). With it off no RPC is issued at all —
     the viewer id is withheld below, so no member waits 8 seconds for a
     timeout before the fallback renders. Watch is never on the RPC anyway. */
  const serverView = EXPLORE_SERVER_STREAM_ENABLED && view !== 'watch';
  /* EVERY SERVER VIEW WAITS FOR GEOGRAPHY, All included. All does not show the
     scope row (that is still SCOPED_VIEWS' job) but it does send the club,
     county and country, and the RING on every card is decided by them. Firing
     before the shared resolver settles sent a null club and read every card as
     `world` — which is why the 0.8 club ring had never fired for anyone. */
  const serverReady = serverView && geography.isFetched;

  /* BRIEF_COURSES_MERGED §5, §6, §7 THE INDEX PATH. Search, a chosen place and
     the My circle scope are all answered from the ONE candidate index, because
     all three ask a question the ranker's keyset pages cannot answer without
     dropping rows: a page filtered after ranking is a page that lies about how
     much it found. When the index path is in charge NO RPC IS ISSUED at all. */
  const indexPath = view === 'courses' && (filtering || activeScope === 'circle');
  /* THE RPC HAS NO 'circle' SCOPE. Reported: rather than invent a scope string
     the deployed function would fall through, the circle set is composed from the
     index above and the RPC is not asked. */
  const chipScope = activeScope === 'circle' ? 'world' : activeScope;
  /* SCORES: A CHOSEN PLACE IS THE *WHERE* (BRIEF_EXPLORE_SECOND_PASS §3). The
     rounds body already reads geography from ONE resolver and already knows how
     to be asked for a county or a country, so a chosen place is expressed in that
     same vocabulary rather than in a second filtering path: the place supplies
     the county and country, and the scope the ranker is asked for becomes
     'county' (a region was chosen) or 'country'. The chips stay usable — a member
     who then picks My club is asking a narrower question and gets it. */
  const placeScoped = view === 'scores' && place !== null;
  const streamGeo = placeScoped
    ? { ...geography.scope, county: place?.region ?? null, country: place?.country ?? null }
    : geography.scope;
  const serverScope: ScoreScope =
    placeScoped && chipScope === 'world' ? (place?.region ? 'county' : 'country') : chipScope;
  const server = useExploreStream(userId && serverReady && !indexPath ? userId : undefined, view, serverScope, {
    clubId: streamGeo.primaryClubId,
    county: streamGeo.county,
    country: streamGeo.country,
  });

  /* §2 ONE MIXED STREAM, TWO SERVER POOLS. The ranker still serves this view -
     the merge changes COMPOSITION, not ranking: each pool arrives already ranked
     and cadenced by the RPC and the two are interleaved by the score the RPC
     itself assigned. docs/sql/explore_courses_merged_search.sql files the
     unapplied one-pool change that would let SQL do the merge outright. */
  const serverReviews = useExploreStream(
    userId && serverReady && !indexPath && view === 'courses' ? userId : undefined,
    'reviews',
    serverScope,
    { clubId: geography.scope.primaryClubId, county: geography.scope.county, country: geography.scope.country },
  );
  const serverOn = serverView && !indexPath && !server.unavailable && server.isFetched && server.items.length > 0;
  /* THE FALLBACK CONDITION, in one place. While the RPC is still in flight the
     client composition is NOT fetched - the server hook shows its own shells, so
     a member never pays for two rankers. */
  const fallbackWanted = !serverView || server.unavailable;
  const stream = useExploreStreamClient(
    fallbackWanted && !indexPath ? userId : undefined,
    /* THE MERGED VIEW'S FALLBACK REVIEWS. The client composition has always
       composed the reviews pool under the 'reviews' view; the merged view asks it
       for exactly that and takes its course cards from useScopeCourses below. */
    view === 'courses' ? 'reviews' : view,
    { active: serverScope, geography: streamGeo },
    /* WATCH IS ITS OWN SURFACE NOW (BRIEF_WATCH_MIXED_FEED): WatchFeed owns the
       long-form, clip and community reads, so this composition no longer issues
       a single read for it. */
    { enabled: fallbackWanted && !indexPath && view !== 'watch' },
  );
  /* BRIEF_EXPLORE_ALL_VIDEO — ONE LONG-FORM READ FOR THE WHOLE PAGE. The rail
     (§1) and the stream candidates (§2) are the SAME rows, from the same read
     Watch uses, under Watch's own 'latest' query key. Nothing new was written to
     fetch video and nothing else on All reads long-form. */
  const allVideos = useWatchVideos({ userId: view === 'all' ? userId : undefined, mode: 'latest', search: null });
  const videoRows = useMemo(
    () => ((allVideos.data?.pages ?? []).flat() as HubRpcRow[]).filter((row) => !!row?.post_id),
    [allVideos.data],
  );
  const videoPosts = useMemo(() => toFeedPosts(videoRows), [videoRows]);
  /* §2 LONG-FORM AS CANDIDATES, SCORED BY THE ONE MODEL (scoreItem). REPORTED,
     NOT PAPERED OVER: a video has no course, no score and no standing, so it
     carries NO consequence, and the ring is 'own' only when the viewer is the
     creator - a followed creator is a circle relationship, which this model
     expresses as a round's consequence and NOT as a ring, so a video from your
     circle gets no ring lift. It therefore ranks on FRESHNESS alone, exactly as
     a clip does. No consequence was invented to lift it.
     FOUR AT MOST. The rail is where video has volume; the stream takes a
     page's worth so a fresh batch cannot turn All into a media page. */
  const videoItems = useMemo<StreamItem[]>(() => {
    if (view !== 'all') return [];
    return videoRows.slice(0, 4).map((row) => {
      const item: StreamItem = {
        id: `watch:${row.post_id}`,
        kind: 'watch',
        ring: row.post_user_id && userId && row.post_user_id === userId ? 'own' : null,
        lane: 'news',
        score: 0,
        consequence: null,
        subject: null,
        who: {
          user_id: row.post_user_id ?? null,
          display_name: row.creator_display_name ?? row.creator_username ?? null,
          photo_url: row.creator_avatar_url ?? null,
          is_viewer: !!userId && row.post_user_id === userId,
        },
        facts: {
          post_id: row.post_id,
          media_id: row.media_id ?? null,
          duration_s: row.duration_seconds ?? null,
          arrived_at: row.post_created_at ?? null,
          published_at: row.post_created_at ?? null,
        },
        payload: { video: row },
        seen: false,
      };
      item.score = scoreItem(item);
      return item;
    });
  }, [view, videoRows, userId]);

  const scoresStanding = useViewerStanding(userId);

  /* §6h REMOVED BY RULING: the no-connection sentence never renders on All,
     for any member. An unconnected member simply gets the platform-wide
     stream. The invitation lives on Scores, in context. The
     'amateur.stream.nothingYet' locale keys stay, unused, for Phase E. */

  /* §5b THE COURSES VIEW'S OWN BODY. Course cards are not rounds, reviews or
     media, so they are composed by their own hook off get_board_courses and the
     shared geography — the client stream is left exactly as B2 shipped it. */
  const coursesView = useScopeCourses(
    userId,
    serverScope,
    geography.scope,
    /* THE FALLBACK ONLY. With the RPC serving Courses this composition is not
       fetched at all; it wakes up if the server read is unavailable. */
    view === 'courses' && geography.isFetched && !serverOn && !indexPath,
  );

  /* THE CANDIDATE INDEX (BRIEF_COURSES_MERGED). One bounded read behind the four
     new rails, the search and the region dropdown, so a count and a tile can
     never disagree. SCORES SHARES IT (BRIEF_EXPLORE_SECOND_PASS §3): its place
     dropdown is the same component reading the same index, so the two views can
     never disagree about which places exist or how many courses are in one. */
  const candidates = useCourseCandidateIndex(view === 'courses' || view === 'scores');
  const circle = useCircleCourseIds(userId, view === 'courses');
  /* "HAS CONTENT" IS A PARAMETER, NOT A FORK (§3). Scores is rounds, so a place
     qualifies on TRACKED ROUNDS; the merged Courses view keeps rounds OR ratings. */
  const places = useMemo(
    () => placeTree(candidates.index, view === 'scores' ? 'rounds' : 'roundsOrRatings'),
    [candidates.index, view],
  );

  const searchHit = useMemo(
    () => (query.length >= 2 ? searchCourses(candidates.index, query) : null),
    [candidates.index, query],
  );
  const resultIds = useMemo(() => {
    if (!indexPath) return null;
    if (searchHit) return searchHit.courseIds;
    if (place) return placeCourseIds(candidates.index, place);
    return circleCourseIds(candidates.index, circle.circleIds);
  }, [indexPath, searchHit, place, candidates.index, circle.circleIds]);
  const results = useCourseResults(candidates.index, resultIds, searchHit?.reviewIds ?? null, userId);
  const indexSource = useMemo(
    () => ({
      items: results.items,
      total: results.total,
      isFetched: candidates.isFetched && (!circle.isFetched ? activeScope !== 'circle' : true),
    }),
    [results.items, results.total, candidates.isFetched, circle.isFetched, activeScope],
  );

  /* §2 THE MERGED BODY. Course cards and review cards in ONE stream, ordered by
     the score each pool already carries. */
  const mergedServerItems = useMemo(() => {
    if (view !== 'courses') return server.items;
    return [...server.items, ...serverReviews.items].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }, [view, server.items, serverReviews.items]);
  const mergedFallbackItems = useMemo(() => {
    if (view !== 'courses') return stream.items;
    /* THE FALLBACK CARRIES NO COMPARABLE SCORE (the client composition scores
       reviews 0), so the two pools are ZIPPED rather than sorted - an honest
       alternation instead of a ranking that is not there. */
    const out: StreamItem[] = [];
    const a = coursesView.items;
    const b = stream.items;
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if (a[i]) out.push(a[i]);
      if (b[i]) out.push(b[i]);
    }
    return out;
  }, [view, coursesView.items, stream.items]);

  /* THE VIEW'S SOURCE, in one place: everything below reads `source`, so a
     single-type view and the mixed stream take the same reveal, sentinel,
     page-loaded and end paths. */
  const source = indexPath
    ? indexSource
    : serverOn
      ? { ...server, items: mergedServerItems }
      : view === 'courses'
        ? {
            items: mergedFallbackItems,
            total: mergedFallbackItems.length,
            isFetched: coursesView.isFetched && stream.isFetched,
          }
        : stream;

  /* PHASE C §3a-§3c THE COURSE SHELVES. Each shelf renders nothing when its
     source is empty. Geography comes from the shared resolver above — no second
     derivation, and C1's county and world shelves are REUSED here, not rebuilt. */
  const shelvesWanted = view === 'all' || view === 'courses';
  const countyCourses = useCountyCourses(userId, geography.scope, shelvesWanted && geography.isFetched);
  const worldCourses = useWorldTop100Courses(shelvesWanted);
  const listCourses = useListCourses(userId, shelvesWanted);
  /* §5a THE LIST SHELF'S SECOND LINE reads the events the ranker already
     computed for the rows on this page - no per-tile query. A course with no
     event, or with a tie between two kinds, keeps its AREA. */
  const listEvents = useMemo(() => listCourseEvents(source.items), [source.items]);
  const topRatedCourses = useRecentCourseRatings(false);
  /* §4 THE FOUR NEW RAILS, all from the index. */
  const mergedShelves = useMergedCourseShelves(candidates.index, geography.scope.county, circle.circleIds);


  /* THE SERVER PAGE IS ALREADY A PAGE. Reveal slicing belongs to the client
     composition only; re-slicing a ranked, cadenced page would hide cards the
     RPC deliberately placed. */
  const visible = useMemo(() => {
    const base = serverOn ? source.items : source.items.slice(0, revealed);
    if (videoItems.length === 0) {
      const { items: uniqueBase, drops: baseDrops } = dedupeItems(base);
      warnDuplicates('ExploreMagazine:visible', baseDrops);
      return uniqueBase;
    }
    /* AN INSERTION, NOT A RE-SORT. The server's page is already ranked and
       cadenced and the client re-sorts nothing: each video is placed at the
       first position whose card scores below it, so every other card keeps the
       order the ranker gave it. A row already on the page (the fallback's own
       media pool) is never duplicated. */
    const seen = new Set(base.map((entry) => entry.facts.post_id ?? entry.id));
    const out = [...base];
    for (const video of videoItems) {
      if (seen.has(video.facts.post_id ?? video.id)) continue;
      let at = out.findIndex((entry) => entry.score < video.score);
      if (at < 0) at = out.length;
      /* A VIDEO MAY LEAD, and only by out-scoring the current lead - which
         freshness alone can do on a quiet page. Nothing here holds it back and
         nothing here promotes it. */
      out.splice(at, 0, video);
    }
    /* BRIEF_ROUND_SHEET_TALL §2 — ONE ITEM, ONE CARD, whatever the source. The
       stream hook already dedupes its own pages; this is the last gate before
       anything is keyed by item.id (cardRefs, the ring, roundSeq), so a duplicate
       arriving from the fallback pools or the video insertion cannot reach it
       either. First occurrence wins, so the ranked order is untouched. */
    const { items: unique, drops } = dedupeItems(out);
    warnDuplicates('ExploreMagazine:visible', drops);
    return unique;
  }, [serverOn, source.items, revealed, videoItems]);

  /* THE COURSE IMAGE AND REGION ARRIVE IN ONE ROUND TRIP for every card on
     screen, and a card holds its whole shell until that resolver settles —
     `pending` is never a gradient standing in for an unknown. */
  const courseIds = useMemo(
    () => visible.map((item) => item.subject?.course_id).filter((id): id is string => !!id),
    [visible],
  );
  const meta = useCourseCardMeta(courseIds);
  /* useRoundHoleShapes RETURNS `Map | null` — null while unresolved. Keep that
     state distinct from a settled map with no key, so cards never manufacture a
     treatment from hole detail that has not arrived. */
  const shapesMap = useRoundHoleShapes(useMemo(() => visible.map((item) => item.facts.score_id ?? null), [visible]));
  /* THE VIEWER'S OWN BEST PER COURSE. ONE batched viewer-scoped read for the
     whole page, never per card, so a record headline can say what the record was
     measured against. Absent = the comparison is dropped, never invented. */
  const viewerBests = useViewerCourseBests(userId ?? undefined);

  const enriched = useMemo(
    () =>
      visible.map((item) => {
        const subject = item.subject;
        if (!subject?.course_id) return item;
        const row = meta.data?.get(subject.course_id);
        return {
          ...item,
          subject: {
            ...subject,
            course_name: subject.course_name ?? row?.name ?? null,
            region: subject.region ?? row?.region ?? null,
            sub_country: subject.sub_country ?? row?.subCountry ?? null,
            image_url: subject.image_url ?? row?.imageUrl ?? null,
            pending: subject.pending ? !meta.isFetched : false,
          },
        };
      }),
    [visible, meta.data, meta.isFetched],
  );

  /* ONE RANK CARD PER COURSE PER CHANGE. The gate sits HERE, after enrichment
     and before blocks, so the SERVER page and the client fallback are rationed
     by the same rule and neither can slip a standing claim past it. It reads the
     standing rows this page already holds - no new query. */
  const standingByCourse = useMemo(() => {
    const map = new Map<string, StandingRow>();
    for (const row of scoresStanding.rows) map.set(row.course_id, row);
    return map;
  }, [scoresStanding.rows]);
  const rankGate = useMemo(() => applyRankCardRule(enriched, standingByCourse), [enriched, standingByCourse]);
  const ranked = rankGate.items;



  /* §3e THE ALL ORDER AFTER THE LEAD, in one place. Page 3+ restarts from
     clips through shelfForOrdinal; an empty shelf consumes its scheduled slot
     and the next rail waits for the next four-card boundary. */
  /* BRIEF_EXPLORE_ALL_VIDEO §1 PLACEMENT: videos sit FOURTH, between standing
     and the county courses rail, so no two media rails are adjacent - clips is
     first, moments fifth, and videos has a non-media rail on either side. Two
     media rails in a row would read as a media section, which All is not. */
  const ALL_SHELVES: ShelfKind[] = [
    'clips',
    'clubWeek',
    'standing',
    'videos',
    'coursesCounty',
    'moments',
    'people',
    'coursesWorld',
    'coursesList',
  ];
  /* BRIEF_COURSES_MERGED §4 THE MERGED VIEW'S SEVEN RAILS, IN ORDER, NEVER
     REPEATING WITHIN A SESSION - each kind appears exactly ONCE in this array, so
     a repeat is not possible by construction rather than by discipline.
     THE LEAD RAIL is highest rated (month, widening to the year with its heading).
     ON YOUR LIST comes second and ONLY WHERE IT EXISTS - the shelf renders
     nothing for a member with no list and NO PROMPT takes its place; the next
     rail simply takes the slot, which is the existing skip rule.
     A rail with nothing in it is SKIPPED. */
  const COURSES_SHELVES: ShelfKind[] = [
    'coursesLeadRated',
    'coursesList',
    'coursesCircle',
    'coursesCounty',
    'coursesWorthDrive',
    'coursesWorld',
    'coursesNew',
  ];
  /* SCORES SHELVES — the four that are about the MEMBER'S OWN GOLF, inserted
     after 3 cards and every 4 thereafter, then repeated without Your circle.
     WHY 'standing' IS A SHELF AND NOT A CARD: a shelf may show a position with
     no motion — that is a standing, and a standing is worth looking at. A CARD
     must announce a CHANGE, which is the same distinction that retired
     rank_hold; do not promote this shelf into the card ladder. */
  /* CHANGE EARNS HEIGHT. The daily/weekly rail leads the repeating cycle;
     slower standing and county rails follow; the growth prompt is last. */
  const SCORES_SHELVES: ShelfKind[] = ['clubWeek', 'standing', 'coursesCounty', 'people'];
  const shelves: ShelfKind[] =
    view === 'watch'
      ? /* WATCH COMPOSES ITS OWN RAILS (BRIEF_WATCH_MIXED_FEED): windows into its
           own clip and community feeds, with no see-all on any of them. */
        []
      : view === 'scores'
        ? SCORES_SHELVES
        : view === 'courses'
          ? /* §4 SHELVES STAND DOWN ENTIRELY when the member has searched or
               picked a place: they would answer a different question to the one
               just asked. The My circle scope KEEPS them - it is a scope, not a
               question. */
            filtering
            ? []
            : COURSES_SHELVES
          : ALL_SHELVES;
  const singleType = view === 'courses';
  const blocks = useMemo(
    () =>
      buildBlocks(ranked, shelves, false, {
        bareRoundPairs: view === 'scores',
        repeatShelves: view === 'scores' || view === 'all',
        /* §3 THE MERGED VIEW'S RHYTHM: pairs are STABLE-FACT COURSE CARDS only,
           reviews and event cards always full width. */
        mergedCourses: view === 'courses',
      }),
    [ranked, view, activeScope, shelves, singleType],
  );
  const treatments = useMemo(() => cardTreatments(ranked), [ranked]);


  /* ONE PAGE-LOADED EVENT PER REVEAL, with the REAL returned count. */
  const loggedRef = useRef(0);
  useEffect(() => {
    if (!source.isFetched) return;
    const page = Math.ceil(visible.length / STREAM_PAGE_SIZE);
    if (page === loggedRef.current) return;
    loggedRef.current = page;
    /* THE REAL LANE MIX (D2). Counted from what is on the page, never asserted:
       the client fallback is all news, the RPC splits rounds into news/backlog. */
    const backlog = visible.reduce((n, item) => n + (item.lane === 'backlog' ? 1 : 0), 0);
    analyticsEvents.track('amateur_stream_page_loaded', {
      page,
      returned: visible.length,
      lane_mix: `news:${visible.length - backlog},backlog:${backlog}`,
      backlog_count: backlog,
      view,
    });
  }, [source.isFetched, visible, view]);


  /* §6f THE SENTINEL MEANS LOADING, NOT "MORE EXISTS". When the pool is spent it
     unmounts and the page ends at the last card. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = serverOn ? server.hasNextPage : revealed < source.items.length;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (serverOn) server.fetchNextPage();
        else setRevealed((n) => n + STREAM_PAGE_SIZE);
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, serverOn, server]);

  useEffect(() => {
    if (source.isFetched && !hasMore && source.items.length > 0) {
      analyticsEvents.track('amateur_stream_end', { pages: Math.ceil(source.items.length / STREAM_PAGE_SIZE), view });
    }
  }, [source.isFetched, hasMore, source.items.length, view]);

  const depart = useCallback(() => rememberAmateurScroll(), []);

  const changeView = useCallback(
    (next: string) => {
      const value = next as ExploreView;
      if (!EXPLORE_VIEWS.includes(value)) return;
      analyticsEvents.track('amateur_view_changed', { from: view, to: value });
      setView(value);
      if (value === 'scores') scoreScopeChosen.current = false;
      /* LEAVING THE MERGED VIEW CLEARS ITS QUESTION. A search or a place is an
         answer to something asked on that view; carrying it into the next visit
         would filter a page the member never filtered. */
      setSearch('');
      setPlace(null);
      writeExploreView(value);
      setRevealed(STREAM_PAGE_SIZE);
      loggedRef.current = 0;
      /* A view is not a route: no history entry, no scroll animation. */
      scrollPageToTop('auto');
    },
    [view],
  );

  /*
   * BRIEF_ROUND_SHEET_TALL §3 — ?cues=reset BRINGS THE CUES BACK.
   *
   * The cues retire for good once a member has paged, so anyone who has used the
   * sheet can never see the nudge again — including whoever needs to check it.
   * Opening Explore with ?cues=reset forgets this device's hint once and strips
   * just that parameter from the URL, leaving every other one alone. Live in
   * every environment, production included: it only resets a hint, and only for
   * the viewer holding the device.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('cues') !== 'reset') return;
    resetHint();
    url.searchParams.delete('cues');
    window.history.replaceState(
      window.history.state, '', `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  /* ==================================================================== §2
     SWIPE BETWEEN ROUNDS. THE SEQUENCE IS THIS PAGE'S ROUNDS, IN ITS ORDER.

     Rounds only, in the ranked order already on screen — a review, a course, a
     clip or a long-form video is a different sheet, so none of them is a page.
     Paging exists HERE, on the stream, and nowhere else: every other consumer
     of RoundDetailSheet passes no sequence and keeps today's single round. */
  const roundSeq = useMemo(
    () => ranked.filter((item) => item.kind === 'round' && !!item.facts.score_id),
    [ranked],
  );
  const [pageIx, setPageIx] = useState<number | null>(null);
  const pageIxRef = useRef<number | null>(null);
  pageIxRef.current = pageIx;
  const [shift, setShift] = useState<{ dx: number; opacity?: number; animating: boolean } | null>(null);
  const [swipeHintOn, setSwipeHintOn] = useState(false);
  /* BRIEF_ROUND_SHEET_PEEK §1 — the neighbour drawn beside the current page
     while a drag or its commit is in flight. One side only, and never at an end. */
  const [preview, setPreview] = useState<{ side: 'next' | 'prev'; ix: number } | null>(null);
  const pageTimers = useRef<number[]>([]);
  const after = useCallback((ms: number, fn: () => void) => {
    pageTimers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => { pageTimers.current.forEach((id) => window.clearTimeout(id)); }, []);

  const loadMoreStream = useCallback(() => {
    if (!hasMore) return;
    if (serverOn) server.fetchNextPage();
    else setRevealed((n) => n + STREAM_PAGE_SIZE);
  }, [hasMore, serverOn, server]);

  /** §1.3 — one seed builder, used by the tap AND by every page after it. */
  const seedFor = useCallback((item: StreamItem): RoundDetailSeed | null => {
    if (!item.facts.score_id || !item.subject?.course_name) return null;
    const shape = shapesMap?.get(item.facts.score_id) ?? null;
    const seedHoles = (shape?.holes ?? []).map((h) => ({
      holeNo: h.holeNo, par: h.par, strokes: h.sheetStrokes,
    }));
    if (seedHoles.length === 0) return null;
    const gross = seedHoles.every((h) => h.strokes != null)
      ? seedHoles.reduce((sum, h) => sum + (h.strokes ?? 0), 0)
      : null;
    const par = seedHoles.every((h) => h.par != null)
      ? seedHoles.reduce((sum, h) => sum + (h.par ?? 0), 0)
      : null;
    return {
      scoreId: item.facts.score_id,
      holes: seedHoles,
      gross,
      toPar: gross != null && par ? gross - par : null,
      courseName: item.subject.course_name,
      placeLine: coursePlaceLine({
        region: item.subject.region,
        subCountry: item.subject.sub_country,
        country: item.subject.country ?? null,
      }),
      playerName: item.who?.display_name ?? null,
      playerAvatarUrl: item.who?.photo_url ?? null,
      playDate: item.facts.play_date ?? null,
    };
  }, [shapesMap]);

  /**
   * §1 — THE PREVIEW'S SEED. seedFor() returns null when the feed holds no hole
   * rows for a round; the preview still needs the course, the place, the member
   * and the date so it can draw the summary with the syncing middle beneath it
   * rather than a blank panel. Nothing here fetches.
   */
  const previewSeedFor = useCallback((item: StreamItem | undefined): RoundDetailSeed | null => {
    if (!item?.facts.score_id) return null;
    const seeded = seedFor(item);
    if (seeded) return seeded;
    return {
      scoreId: item.facts.score_id,
      holes: [],
      gross: null,
      toPar: null,
      courseName: item.subject?.course_name ?? '',
      placeLine: coursePlaceLine({
        region: item.subject?.region ?? null,
        subCountry: item.subject?.sub_country ?? null,
        country: item.subject?.country ?? null,
      }),
      playerName: item.who?.display_name ?? null,
      playerAvatarUrl: item.who?.photo_url ?? null,
      playDate: item.facts.play_date ?? null,
    };
  }, [seedFor]);

  /** Shows a round in the sheet: seed, ring, feed position and neighbours.
   *  The DETENT is not touched — paging keeps the height the member chose. */
  const showRound = useCallback((item: StreamItem, ix: number) => {
    setPageIx(ix);
    pageIxRef.current = ix;
    setSheetSeed(seedFor(item));
    setRingId(item.id);
    revealCard(item.id);
    opener.openByScore(item.facts.score_id, item.facts.connection_id ?? null, item.who?.user_id ?? null);
    /* §2.3 — both neighbours are fetched once this page settles, so the next
       swipe is a seeded card that fills in rather than a skeleton. */
    for (const n of neighbours(ix, roundSeq.length)) prefetchRound(roundSeq[n]?.facts.score_id);
    if (shouldExtend(ix, roundSeq.length)) loadMoreStream();
  }, [seedFor, revealCard, opener, roundSeq, prefetchRound, loadMoreStream]);

  const prefersReducedMotion = useCallback(
    () => typeof window !== 'undefined'
      && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  /* ==================================================================== §2
     BRIEF_ROUND_SHEET_CUES §2 — THE NUDGE REPLACES THE TEXT HINT.

     The line retired after three opens, so for anyone who has used the sheet
     there was nothing at all saying rounds page sideways. On the first three
     PAGEABLE opens the sheet now shows it instead of saying it: once it has
     settled at mid, the page walks 64px left so the NEXT round's preview shows
     at the right edge, holds, and springs back. It is the SAME preview and the
     SAME track a finger drives — nothing here draws a second thing.

     The finger always wins: any touch or pointer down cancels it mid-flight.
     Reduced motion gets no nudge and keeps the sentence (below). */
  const nudgeCancel = useRef<(() => void) | null>(null);
  const nudgeRelease = useRef<(() => void) | null>(null);

  const cancelNudge = useCallback(() => {
    nudgeCancel.current?.();
    nudgeCancel.current = null;
    nudgeRelease.current?.();
    nudgeRelease.current = null;
  }, []);
  useEffect(() => () => cancelNudge(), [cancelNudge]);

  const startNudge = useCallback((ix: number) => {
    if (ix + 1 >= roundSeq.length) return;
    cancelNudge();
    /* THE FINGER ALWAYS WINS. Capture, so a touch anywhere over the sheet ends
       the nudge before the gesture reads a single move. */
    const bail = () => cancelNudge();
    window.addEventListener('pointerdown', bail, true);
    window.addEventListener('touchstart', bail, true);
    nudgeRelease.current = () => {
      window.removeEventListener('pointerdown', bail, true);
      window.removeEventListener('touchstart', bail, true);
    };
    nudgeCancel.current = runNudge(ix + 1, {
      setShift,
      setPreview,
      setTimeout: (fn, ms) => window.setTimeout(fn, ms),
      clearTimeout: (id) => window.clearTimeout(id),
    });
  }, [roundSeq.length, cancelNudge]);

  const pageTo = useCallback((to: number, direction: 'next' | 'prev') => {
    const from = pageIxRef.current;
    const item = roundSeq[to];
    if (from == null || !item) { setShift(null); return; }
    noteHintPaged();
    setSwipeHintOn(false);
    if (sheetSession.current) sheetSession.current.rounds += 1;
    analyticsEvents.track('round_sheet_page', { direction, index_from: from, index_to: to, view });

    /* REDUCED MOTION IS A CROSSFADE, NEVER A SLIDE — and it never drew a
       neighbour, so there is nothing to peek at either. */
    if (prefersReducedMotion()) {
      setPreview(null);
      setShift({ dx: 0, opacity: 0, animating: true });
      after(160, () => {
        showRound(item, to);
        setShift({ dx: 0, opacity: 1, animating: true });
        after(200, () => setShift(null));
      });
      return;
    }
    /*
     * BRIEF_ROUND_SHEET_PEEK §1 — THE COMMIT.
     *
     * The current page travels out by one sheet width; the preview, offset a
     * width to that same side, arrives at centre in the same movement. When it
     * lands the real sheet is pointed at the new round WITH ITS SEED at dx 0 and
     * the preview unmounts in the same commit — same summary, same nines, same
     * position, so there is nothing to see at the swap. The seed/fetched stroke
     * agreement (part 1) is what makes that safe, and its DEV mismatch log in
     * RoundDetailSheet stays.
     */
    setPreview({ side: direction, ix: to });
    const out = direction === 'next' ? -window.innerWidth : window.innerWidth;
    setShift({ dx: out, animating: true });
    after(180, () => {
      showRound(item, to);
      setShift(null);
      setPreview(null);
    });
  }, [roundSeq, view, prefersReducedMotion, after, showRound]);

  /*
   * BRIEF_ROUND_SHEET_PEEK §1 — THE PREVIEW IS BUILT ONCE PER NEIGHBOUR, NOT
   * ONCE PER FRAME. `shift` changes on every touchmove, so an inline element
   * here would re-render the whole preview sixty times a second for a movement
   * that is pure transform. Memoised on the neighbour alone, the drag costs one
   * composited translate and nothing else.
   */
  const pagePreview = useMemo(() => {
    if (!preview) return null;
    const seed = previewSeedFor(roundSeq[preview.ix]);
    if (!seed) return null;
    return { side: preview.side, node: <RoundPagePreview seed={seed} /> };
  }, [preview, roundSeq, previewSeedFor]);

  /* §3 — WHAT THE SCREEN READER HEARS WHEN A ROUND ARRIVES: the member, the
     course and the gross, in that order, from the seed this page already holds.
     Empty while there is no page, so nothing is announced on open. */
  const pageAnnounce = useMemo(() => {
    if (pageIx == null) return '';
    const seed = previewSeedFor(roundSeq[pageIx]);
    if (!seed) return '';
    return [seed.playerName, seed.courseName, seed.gross == null ? null : String(seed.gross)]
      .filter(Boolean)
      .join(', ');
  }, [pageIx, roundSeq, previewSeedFor]);

  /* THE FINGER. The axis lock, the 8px and the 1.2 ratio live in BottomSheet;
     the thresholds and the end rubber-band live in roundPaging. */
  const pageDrag = useMemo(() => ({
    onStart: () => { cancelNudge(); setShift({ dx: 0, animating: false }); setPreview(null); },
    onMove: (dx: number) => {
      const ix = pageIxRef.current;
      if (ix == null) return;
      setShift({ dx: rubberBand(ix, roundSeq.length, dx), animating: false });
      /* §1 — ONE neighbour, on the side the finger is pulling from, and only
         when there is one: at the ends the resistance is felt against nothing.
         Reduced motion keeps the crossfade and never follows the finger. */
      if (prefersReducedMotion()) return;
      const n = dragNeighbour(ix, roundSeq.length, dx);
      setPreview((cur) => (
        n == null ? null
          : cur && cur.side === n.side && cur.ix === n.index ? cur
            : { side: n.side, ix: n.index }
      ));
    },
    onEnd: (dx: number, velocity: number) => {
      const ix = pageIxRef.current;
      const decision = ix == null ? null : pageDecision(ix, roundSeq.length, dx, velocity);
      if (!decision) {
        /* SPRING-BACK: the preview rides back out with the page and unmounts. */
        setShift({ dx: 0, animating: true });
        after(220, () => { setShift(null); setPreview(null); });
        return;
      }
      pageTo(decision.to, decision.direction);
    },
  }), [roundSeq.length, after, pageTo, prefersReducedMotion, cancelNudge]);

  /* §3 — THE SAME PAGE STEP THE HIDDEN BUTTONS AND THE ARROW KEYS USE. It goes
     through pageTo, so a keyboard page is the same movement, the same analytics
     and the same hint retirement as a swipe. */
  const pageStep = useCallback((direction: 'next' | 'prev') => {
    const ix = pageIxRef.current;
    if (ix == null) return;
    const to = direction === 'next' ? ix + 1 : ix - 1;
    if (to < 0 || to >= roundSeq.length) return;
    cancelNudge();
    pageTo(to, direction);
  }, [roundSeq.length, cancelNudge, pageTo]);

  const tapCard = useCallback(
    (item: StreamItem, size: CardSize, pos: number) => {
      analyticsEvents.track('amateur_card_tapped', {
        kind: item.kind,
        size,
        ring: item.ring,
        lane: item.lane,
        consequence_kind: item.consequence?.kind ?? null,
        pos,
      });

      if (item.kind === 'round' && item.facts.score_id) {
        /* BRIEF_ROUND_SHEET §1.2/§1.3 — the card is seeded from what this page
           already read, the tapped card is ringed and scrolled clear of the
           chip row, and the session's analytics clock starts here.
           §2.1 — the tap also fixes the member's PLACE IN THE SEQUENCE. A round
           that somehow is not in the ranked list still opens, on its own. */
        const ix = roundSeq.findIndex((r) => r.id === item.id);
        const seed = seedFor(item);
        sheetSession.current = { at: Date.now(), maxDetent: 'mid', rounds: 1, stats: false };
        analyticsEvents.track('round_sheet_open', {
          score_id: item.facts.score_id,
          view,
          seeded: seed != null,
        });
        setShift(null);
        cancelNudge();
        /* §2 — ONE COUNTER FOR BOTH CUES. noteHintOpen() is still the first-three
           rule and still retires on the first page; what it now earns is a
           MOVEMENT, and only a reduced-motion reader gets the sentence. */
        const cue = openCue({
          pageable: roundSeq.length > 1,
          hasNext: ix >= 0 && ix + 1 < roundSeq.length,
          reducedMotion: prefersReducedMotion(),
        });
        setSwipeHintOn(cue === 'line');
        if (ix >= 0) {
          showRound(item, ix);
          if (cue === 'nudge') startNudge(ix);
        } else {
          setPageIx(null);
          pageIxRef.current = null;
          setSheetSeed(seed);
          setRingId(item.id);
          revealCard(item.id);
          opener.openByScore(item.facts.score_id, item.facts.connection_id ?? null, item.who?.user_id ?? null);
        }
        return;
      }
      if (item.kind === 'review' && item.payload.review) {
        const review = item.payload.review;
        openReview({
          user: {
            id: review.userId ?? '',
            name: review.reviewerName || t('amateur.stream.aMember', 'A member'),
            username: review.reviewerUsername ?? undefined,
            avatar: review.reviewerAvatar,
          },
          courseId: review.courseId,
          courseName: review.courseName,
          rating: review.rating,
          reviewId: review.reviewId,
          courseCountry: review.courseCountry,
          courseRegion: review.courseRegion,
          courseSubCountry: review.courseSubCountry,
          reviewText: review.quote,
          breakdown: review.breakdown,
        });
        return;
      }
      if (item.kind === 'story' && item.facts.story_slug) {
        depart();
        navigate(`/discover/news/${item.facts.story_slug}`);
        return;
      }
      if (item.kind === 'course' && item.subject?.course_id) {
        depart();
        navigate(`/courses/${item.subject.course_id}`);
        return;
      }
      const media = item.payload.media;
      const moment = item.payload.moment;
      const post = media?.post ?? moment?.post;
      if (post) {
        depart();
        openWithOrigin({
          posts: [post],
          index: 0,
          originEl: null,
          posterUrl: item.subject?.image_url ?? null,
          mediaIndex: media?.mediaIndex ?? moment?.mediaIndex ?? 0,
          mediaId: item.facts.media_id ?? null,
          openedFrom: 'amateur-magazine',
          forceStartAtZero: true,
        });
      }
    },
    [depart, navigate, openReview, opener, revealCard, roundSeq, seedFor, showRound, t, view,
      cancelNudge, startNudge, prefersReducedMotion],
  );

  const tapWho = useCallback(
    (item: StreamItem) => {
      analyticsEvents.track('amateur_card_who_tapped', { kind: item.kind });
      if (item.who?.user_id) opener.openProfile(item.who.user_id);
    },
    [opener],
  );

  const chips = useMemo(
    () =>
      EXPLORE_VIEWS.map((key) => ({
        id: key,
        label:
          key === 'all'
            ? t('amateur.stream.view.all', 'All')
            : key === 'scores'
              ? t('amateur.stream.view.scores', 'Scores')
              : key === 'watch'
                ? t('amateur.stream.view.watch', 'Watch')
                : key === 'courses'
                  ? t('amateur.stream.view.courses', 'Courses')
                  : t('amateur.stream.view.reviews', 'Reviews'),
      })),
    [t],
  );

  /** §5d THE ONE EMPTY SENTENCE of these two views names the scope the member is
   *  looking at, so the row above it is the way out. The county and country names
   *  are DATA; "your club", "your circle" and "the world" are the translated ones. */
  const scopeName =
    activeScope === 'club'
      ? geography.scope.primaryClubName ?? t('amateur.stream.scope.yourClub', 'your club')
      : activeScope === 'circle'
        ? t('amateur.stream.scope.yourCircle', 'your circle')
        : activeScope === 'county'
          ? geography.scope.county ?? t('amateur.stream.scope.theWorld', 'the world')
          : activeScope === 'country'
            ? geography.scope.country ?? t('amateur.stream.scope.theWorld', 'the world')
            : t('amateur.stream.scope.theWorld', 'the world');
  /* A SCOPE WITH NO CARDS BUT SHELVES WITH CONTENT RENDERS THE SHELVES AND NO
     SENTENCE (§5d). The shelves each report their own emptiness. UNSETTLED IS
     NOT EMPTY: while any shelf source is still in flight the sentence is held
     back, so a scope that does have shelves never flashes "nothing here".
     THE MERGED RAILS JOIN THE SAME TEST: the lead rated rail is the one every
     member has, so an empty page with a full rail still shows the rail. */
  const shelvesSettled =
    listCourses.isFetched && countyCourses.isFetched && worldCourses.isFetched && candidates.isFetched;
  const shelvesHaveContent =
    (listCourses.rows.length > 0) ||
    (countyCourses.rows.length > 0) ||
    (mergedShelves.lead.rows.length > 0) ||
    (mergedShelves.worthDrive.length > 0) ||
    (mergedShelves.newly.length > 0) ||
    (mergedShelves.circle.length > 0) ||
    (worldCourses.rows.length > 0);


  /** ONE SHELF RENDERER, TWO CALLERS (§5d): the stream's every-fourth-card slot
   *  and the shelf-only state of an empty scope. A shelf reports its own
   *  emptiness in both. */
  const renderShelf = (shelf: ShelfKind, pos: number) => (
    <>
      {shelf === 'clips' ? (
                  <ClipsShelf pos={pos} onDepart={depart} />
                ) : shelf === 'videos' ? (
                  <VideosShelf
                    rows={videoRows}
                    isFetched={allVideos.isFetched}
                    isError={allVideos.isError}
                    onRetry={() => void allVideos.refetch()}
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'clubWeek' ? (
                  /* THE SAME SHELF THE SCORES VIEW USES — reused, not copied. */
                  <WeeklyClubShelf
                    viewerId={userId}
                    clubId={geography.scope.primaryClubId}
                    clubName={geography.scope.primaryClubName}
                    enabled={!!geography.scope.primaryClubId}

                    pos={pos}
                  />
                ) : shelf === 'circle' ? (
                  /* THE CIRCLE SLOT HAS TWO OCCUPANTS (BRIEF_EXPLORE_SUGGESTED_GOLFERS §1).
                     FOLLOWS NOBODY -> suggested golfers; the circle shelf can
                     never fill for them and skipping it silently means the page
                     never says the one thing that would improve it (52 of 99
                     members followed nobody at the last measurement).
                     FOLLOWS SOMEONE, NO ROUNDS -> nothing. They know who their
                     circle is; the gate is the FOLLOW SET, never the round count.
                     UNRESOLVED -> neither, not for one frame. */
                  !circleSize.isSuccess || circleSize.isFetching ? null : circleSize.data === 0 ? (
                    <PeopleShelf
                      viewerId={userId}
                      clubId={null}
                      clubName={null}
                      enabled={!!userId}
                      pos={pos}
                      source="suggested"
                    />
                  ) : (
                    <CircleShelf viewerId={userId} pos={pos} />
                  )
                ) : shelf === 'standing' ? (
                  <StandingShelf viewerId={userId} pos={pos} />
                ) : shelf === 'coursesCounty' ? (
                  <CourseShelf
                    heading={t('amateur.shelf.aroundCounty', 'Around {{county}}', {
                      county: geography.scope.county ?? '',
                    })}
                    rows={geography.scope.county ? countyCourses.rows : []}
                    isFetched={geography.isFetched && countyCourses.isFetched}
                    kind="courses_county"
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'coursesWorld' ? (
                  /* THE SAME RAIL, TWO HEADINGS. On All it is "Around the world",
                     which is the mixed page's own voice; in the merged Courses
                     view §4 names it "The world's best" with its basis beneath. */
                  <CourseShelf
                    heading={
                      view === 'courses'
                        ? t('amateur.shelf.worldsBest', "The world's best")
                        : t('amateur.shelf.aroundWorld', 'Around the world')
                    }
                    sub={view === 'courses' ? t('amateur.shelf.worldsBestSub', 'Top 100 by rank') : null}
                    rows={worldCourses.rows}
                    isFetched={worldCourses.isFetched}
                    kind="courses_world"
                    pos={pos}
                    onDepart={depart}
                  />

                ) : shelf === 'coursesList' ? (
                  <CourseShelf
                    heading={t('amateur.shelf.onYourList', 'On your list')}
                    rows={listCourses.rows}
                    isFetched={listCourses.isFetched}
                    events={listEvents}
                    kind="courses_list"
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'coursesTopRated' ? (
                  /* §5b THE NEW SHELF: rated in the last 30 days, floor of two
                     ratings, mean descending. The same CourseShelf tile. */
                  <CourseShelf
                    heading={t('amateur.shelf.topRated', 'Best rated lately')}
                    rows={topRatedCourses.rows}
                    isFetched={topRatedCourses.isFetched}
                    kind="courses_top_rated"
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'coursesLeadRated' ? (
                  /* BRIEF_COURSES_MERGED §4 LEAD RAIL. The heading NAMES THE
                     WINDOW the rows actually came from - "this month" until the
                     month cannot fill the rail, then "this year". A month's
                     heading over a year's data is a small lie. */
                  <CourseShelf
                    heading={
                      mergedShelves.lead.window === 'month'
                        ? t('amateur.shelf.highestRatedMonth', 'Highest rated this month')
                        : t('amateur.shelf.highestRatedYear', 'Highest rated this year')
                    }
                    rows={mergedShelves.lead.rows}
                    isFetched={candidates.isFetched}
                    kind={`courses_highest_rated_${mergedShelves.lead.window}`}
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'coursesCircle' ? (
                  <CourseShelf
                    heading={t('amateur.shelf.circlePlays', 'Where your circle plays')}
                    sub={t('amateur.shelf.circlePlaysSub', 'Courses the people you follow have played')}
                    rows={mergedShelves.circle}
                    isFetched={candidates.isFetched && circle.isFetched}
                    kind="courses_circle"
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'coursesWorthDrive' ? (
                  <CourseShelf
                    heading={t('amateur.shelf.worthTheDrive', 'Worth the drive')}
                    sub={t('amateur.shelf.worthTheDriveSub', 'Rated highly by the few who have played them')}
                    rows={mergedShelves.worthDrive}
                    isFetched={candidates.isFetched}
                    kind="courses_worth_drive"
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'coursesNew' ? (
                  <CourseShelf
                    heading={t('amateur.shelf.newOnClbhouz', 'New on clbhouz')}
                    sub={t('amateur.shelf.newOnClbhouzSub', 'Courses rated here for the first time')}
                    rows={mergedShelves.newly}
                    isFetched={candidates.isFetched}
                    kind="courses_new"
                    pos={pos}
                    onDepart={depart}
                  />
                ) : shelf === 'people' ? (
                  <PeopleShelf
                    viewerId={userId}
                    clubId={geography.scope.primaryClubId}
                    clubName={geography.scope.primaryClubName}
                    enabled={geography.isFetched}
                    pos={pos}
                  />
                ) : (
                  <MomentsShelf pos={pos} onDepart={depart} />
                )}
    </>
  );

  let cardPos = 0;

  return (
    <div style={{ fontFamily: SANS }}>
      {/* §3b THE VIEW CHIP ROW starts below the islands because AmateurPage's
          shell pays CHROME_CLEARANCE. On scroll, the shared islands ride away
          and this row pins directly beneath the notch. The sentinel drives the
          one shared safe-area scrim; the scope row remains in normal flow.
          The active view takes the
          FILLED ground (applied) and the rest the outline (selectable) —
          the shared RailChips grammar, not a local look-alike. */}
      <div ref={chipSentinelRef} style={{ height: 0 }} aria-hidden="true" />
      <StickySafeAreaScrim visible={chipsStuck} background={A.CANVAS} />
      <div
        ref={chipBarRef}
        data-stuck={chipsStuck ? 'true' : 'false'}
        style={{
          position: 'sticky',
          top: 'var(--sat, env(safe-area-inset-top, 0px))',
          zIndex: Z.stickyTabs,
          background: A.CANVAS,
          padding: '10px 0 12px',
        }}
      >
        <div style={{ paddingInline: CARD_INSET }}>
          {/* PRIMARY ROW (§1a): the canonical 'md' chip — the same padding and
              font size as the Courses page sort chips — and CENTRED, now that
              four chips fit the row. */}
          <RailChips
            options={chips}
            value={view}
            onChange={changeView}
            ariaLabel={t('amateur.stream.views', 'Explore views')}
            ground="filled-selection"
            align="center-when-fit"
          />
        </div>

      </div>

      {/* THE WATCH VIEW IS ONE ENDLESS MIXED FEED, shape-typed and searchable
          (BRIEF_WATCH_MIXED_FEED). It replaces the stream body entirely; the
          view chips above stay exactly where they are. */}
      {view === 'watch' ? <WatchFeed userId={userId} onDepart={depart} /> : null}

      {/* §6 THE SEARCH FIELD SITS ABOVE THE SCOPE ROW on the merged Courses view.
          Results replace the page BODY; this field, the scope row and the chips
          stay put. */}
      {view === 'courses' ? <CoursesSearchField value={search} onChange={setSearch} /> : null}

      {/* §1 THE SAME SCOPE ROW, THE SAME COMPONENT, for Scores and the merged
          Courses view. Scores does not render it at all where neither a club nor
          a county resolves, and the view is then World.

          BRIEF_EXPLORE_SECOND_PASS §1 REVERSES THE 'sm' RULING. Every secondary
          row in Explore is now ONE size — the Watch filter row's, which is the
          canonical 'md' chip — so the three rows agree with each other and with
          the reference. The hierarchy is carried by position and by the primary
          row being CENTRED, not by shrinking the filter.

          §2 EQUAL WIDTH, DISTRIBUTED: the four chips share the run between the
          left gutter and the place dropdown evenly. The dropdown keeps its own
          width at the right end and is not part of that distribution — it is a
          different kind of control. */}
      {view === 'scores' && geography.isFetched && (geography.scope.primaryClubId || geography.scope.county) ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px 14px',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <RailChips
            options={[
              ...(geography.scope.primaryClubId ? [{ id: 'club', label: t('amateur.stream.scope.club', 'My club') }] : []),
              ...(geography.scope.county ? [{ id: 'county', label: geography.scope.county }] : []),
              ...(geography.scope.country ? [{ id: 'country', label: geography.scope.country }] : []),
              { id: 'world', label: t('amateur.stream.scope.world', 'World') },
            ]}
            value={scoreScope}
            onChange={(next) => {
              const value = next as ScoreScope;
              analyticsEvents.track('amateur_scope_changed', { view, from: scoreScope, to: value });
              scoreScopeChosen.current = true;
              setScoreScope(value);
              setRevealed(STREAM_PAGE_SIZE);
              loggedRef.current = 0;
            }}
            ariaLabel={t('amateur.stream.scopes', 'Scores scope')}
            ground="filled-selection"
            distribute
          />
          </div>
          {/* §3 THE PLACE FILTER COMES TO SCORES — the SAME component and the
              SAME data path as Courses, with the "has content" rule handed in as
              a PARAMETER: Scores is rounds, so a place qualifies on TRACKED
              ROUNDS, which is a strict subset of the Courses rule (rounds OR
              ratings). Picking a place resets scope to World, exactly as on
              Courses; clearing it leaves scope where the member left it. */}
          <RegionDropdown
            tree={places}
            choice={place}
            onChoose={(next) => {
              analyticsEvents.track('amateur_place_changed', {
                view,
                country: next?.country ?? null,
                region: next?.region ?? null,
                scope_reset: next !== null && scoreScope !== 'world',
              });
              setPlace(next);
              if (next !== null) {
                scoreScopeChosen.current = true;
                setScoreScope('world');
              }
              setRevealed(STREAM_PAGE_SIZE);
              loggedRef.current = 0;
            }}
          />
        </div>
      ) : null}

      {/* §5, §7 THE MERGED VIEW'S SCOPE ROW AND ITS PLACE DROPDOWN.
          PLACE IS *WHERE*, SCOPE IS *WHOSE*, AND THEY COMPOSE — BUT CHOOSING A
          PLACE RESETS SCOPE TO WORLD (BRIEF_EXPLORE_DEVICE_PASS §5).

          Browsing a place MEANS browsing everyone in it, so picking Kent shows
          everyone in Kent and the scope row says World, which is the truth. The
          member can then narrow to My circle within Kent, because the chips stay
          fully usable. Clearing the place leaves scope exactly where the member
          last put it.

          THE OLD RULE IS REVERSED AND DELIBERATELY SO: it left My circle lit
          while the place quietly ignored it, so two controls looked active and
          one did nothing, and "everyone in Kent" could not be reached at all.
          NO CONTROL IS EVER LIT WHILE DOING NOTHING. */}
      {view === 'courses' && geography.isFetched ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px 14px',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {/* A CONTROL THAT CANNOT CHANGE WHAT YOU SEE DOES NOT RENDER: with no
              circle and no county the only chip would be World, so the chips
              stand down and the place dropdown - which does have somewhere to go
              - keeps the row. */}
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            {hasCircle || geography.scope.county ? (
            <RailChips
              options={[
                ...(hasCircle ? [{ id: 'circle', label: t('amateur.stream.scope.circle', 'My circle') }] : []),
                ...(geography.scope.county ? [{ id: 'county', label: geography.scope.county }] : []),
                ...(geography.scope.country ? [{ id: 'country', label: geography.scope.country }] : []),
                { id: 'world', label: t('amateur.stream.scope.world', 'World') },
              ]}
              value={coursesScope}
              onChange={(next) => {
                const value = next as ScoreScope;
                analyticsEvents.track('amateur_scope_changed', { view, from: coursesScope, to: value });
                setCoursesScope(value);
                setRevealed(STREAM_PAGE_SIZE);
                loggedRef.current = 0;
              }}
              ariaLabel={t('amateur.stream.scopes', 'Scores scope')}
              ground="filled-selection"
              distribute
            />
            ) : null}
          </div>
          <RegionDropdown
            tree={places}
            choice={place}
            onChoose={(next) => {
              analyticsEvents.track('amateur_place_changed', {
                view,
                country: next?.country ?? null,
                region: next?.region ?? null,
                scope_reset: next !== null && coursesScope !== 'world',
              });
              setPlace(next);
              /* CHOOSING A PLACE MEANS EVERYONE IN IT (§5). Clearing it changes
                 nothing about scope. */
              if (next !== null) {
                setCoursesScope('world');
              }
              setRevealed(STREAM_PAGE_SIZE);
              loggedRef.current = 0;
            }}
          />
        </div>
      ) : null}




      {/* §6 EMPTY SEARCH: one line, controls intact, no suggestions. */}
      {view === 'courses' && query.length >= 2 && candidates.isFetched && source.items.length === 0 ? (
        <div style={{ paddingInline: 20, paddingBottom: BLOCK_GAP }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: A.BODY }}>
            {t('amateur.courses.noMatch', 'Nothing matches {{query}}.', { query })}
          </p>
        </div>
      ) : null}


      {view === 'scores' ? (
        <div style={{ marginBottom: BLOCK_GAP }}>
          <CircleShelf viewerId={userId} pos={0} />
        </div>
      ) : null}

      {/* COLD START SHOWS THE SHORTEST PLAUSIBLE CARD, never a lead shell: a
          loading state is never larger than the state it resolves into. */}
      {singleType && source.isFetched && source.items.length === 0 ? (
        /* §5d NEVER A BLANK VIEW. Where the shelves carry content they render and
           the sentence stays away; where the scope is empty of EVERYTHING there
           is exactly ONE sentence, and the scope row above it stays so the
           member can widen. */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: BLOCK_GAP }}>
          {/* AN EMPTY SHELF LEAVES NO GAP. A wrapping div still claims its row
              gap in this grid, so the shelf-only state renders each rail as a
              FRAGMENT: a rail that returns null now occupies nothing at all. */}
          {shelves.map((shelf) => (
            <Fragment key={`empty-shelf:${shelf}`}>{renderShelf(shelf, 0)}</Fragment>
          ))}
          {shelvesSettled && !shelvesHaveContent ? (
            <div style={{ paddingInline: 20, marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: A.BODY }}>
                {view === 'courses'
                  ? t('amateur.stream.empty.courses', 'No courses in {{scope}} yet.', { scope: scopeName })
                  : t('amateur.stream.empty.reviews', 'No reviews in {{scope}} yet.', { scope: scopeName })}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}


      {/* minmax(0,1fr), NOT bare 1fr: a grid item's automatic minimum is its
          min-content, and the kicker/who-line are single-line nowrap — without
          the zero minimum a long course name widens the whole track past the
          viewport at 320px instead of clipping inside the card. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: BLOCK_GAP }}>
        {!source.isFetched && ranked.length === 0 ? (
          <>
            <div style={{ paddingInline: CARD_INSET }}><StdShell /></div>
            <div style={{ paddingInline: CARD_INSET }}><StdShell /></div>
          </>
        ) : null}

        {blocks.map((block, index) => {
          if (block.kind === 'shelf') {
            const pos = cardPos;
            return <Fragment key={`shelf:${block.shelf}:${index}`}>{renderShelf(block.shelf, pos)}</Fragment>;
          }

          if (block.kind === 'pair') {
            const base = cardPos;
            cardPos += 2;
            return (
              <div
                key={`pair:${block.items[0].id}`}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, paddingInline: CARD_INSET }}
              >
                {block.items.map((item, offset) => (
                  /* §1.2 — a pair rings the CARD THAT WAS TAPPED, never both. */
                  <div
                    key={item.id}
                    ref={(el) => { cardRefs.current.set(item.id, el); }}
                    onPointerDown={() => prefetchRound(item.facts.score_id)}
                    style={{ minWidth: 0, ...ringStyle(item.id) }}
                  >
                    <ExploreCard
                      item={item}
                      size="pair"
                      cardTreatment="standard"
                      onTap={() => tapCard(item, 'pair', base + offset)}
                      onWhoTap={item.who?.user_id ? () => tapWho(item) : undefined}
                    />
                  </div>
                ))}
              </div>
            );
          }

          const item = block.item;
          const pos = cardPos;
          cardPos += 1;
          const size: CardSize = block.kind === 'lead' ? 'lead' : 'std';
          /* §2 THE LONG-FORM CARD IS WATCH'S CARD. On All it wears the same
             12px inset and 14px radius as its magazine neighbours; Watch keeps
             the shared component's default full-bleed treatment. Duration,
             title, creator and playback still come from the one shared unit. */
          if (item.kind === 'watch' && item.payload.video) {
            const row = item.payload.video;
            const index = videoRows.findIndex((entry) => entry.post_id === row.post_id);
            return (
              <div key={item.id} style={{ paddingInline: CARD_INSET }}>
                <VideoCard
                  row={row}
                  context="all"
                  onPress={() => {
                    analyticsEvents.track('amateur_card_tapped', { kind: 'watch', size, pos });
                    depart();
                    openWithOrigin({
                      posts: videoPosts,
                      index: index < 0 ? 0 : index,
                      originEl: null,
                      posterUrl: row.poster_url ?? null,
                      openedFrom: 'amateur-watch',
                      forceStartAtZero: true,
                    });
                  }}
                />
              </div>
            );
          }
          const own = item.subject?.course_id ? viewerBests.bestsAt.get(item.subject.course_id) ?? null : null;
          return (
            <div key={item.id} style={{ paddingInline: CARD_INSET }}>
             <div
               ref={(el) => { cardRefs.current.set(item.id, el); }}
               onPointerDown={() => prefetchRound(item.facts.score_id)}
               style={ringStyle(item.id)}
             >
              <ExploreCard
                item={item}
                size={size}
                cardTreatment={treatments.get(item.id) ?? 'standard'}
                shape={shapesMap === null ? undefined : item.facts.score_id ? shapesMap.get(item.facts.score_id) ?? null : null}
                viewerBest={own?.gross ?? null}
                viewerBestSince={monthLabel(own?.playDate ?? null, i18n.language || 'en')}
                onTap={() => tapCard(item, size, pos)}
                onWhoTap={item.who?.user_id ? () => tapWho(item) : undefined}
              />
             </div>
            </div>
          );
        })}

        {hasMore ? (
          <div ref={sentinelRef} style={{ paddingInline: CARD_INSET }}>
            {/* ONE shell while fetching. Never three. */}
            <StdShell />
          </div>
        ) : null}
      </div>

      {/* The lead shell exists for the case the brief names — a lead arriving
          after a std has already rendered — and is exported from the shells file
          so no block grows its own. */}
      {false ? <LeadShell /> : null}
      {false ? <PairShell /> : null}

      {/* THE SHEET BELONGS TO THE OPENER THAT FILLS IT. AmateurPage mounts a
          sheet on its OWN opener instance, which nothing here writes to, so the
          stream's score-backed card taps also landed nowhere. Mounted against
          this component's opener. */}
      <RoundDetailSheet
        open={!!opener.target}
        onClose={() => {
          /* §3 — one close event carries the session: how deep it went, whether
             the depth section was read, and how long it was open. */
          const session = sheetSession.current;
          if (session) {
            analyticsEvents.track('round_sheet_close', {
              detent: session.maxDetent,
              rounds_viewed: session.rounds,
              reached_stats: session.stats,
              dwell_ms: Date.now() - session.at,
              view,
            });
            sheetSession.current = null;
          }
          /* §2.4 — BACK AND ESCAPE CLOSE. They never page, and the ring is left
             on the round the member was reading so the feed is where they were. */
          cancelNudge();
          setRingId(null);
          setSheetSeed(null);
          setShift(null);
          setPreview(null);
          setPageIx(null);
          pageIxRef.current = null;
          setSwipeHintOn(false);
          opener.close();
        }}
        /* §2.4 — EVERY ACTION READS THE CURRENT PAGE. The score id, the
           connection, the owner and the seed all come from the opener target
           that showRound() rewrote, so likes, comments, view profile and view
           course can never act on the round the member swiped away from. */
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
        seed={sheetSeed}
        detents={['mid', 'full']}
        onDetentChange={(detent) => {
          if (detent === 'full' && sheetSession.current) sheetSession.current.maxDetent = 'full';
          analyticsEvents.track('round_sheet_detent', { detent, view });
        }}
        onStatsSeen={() => {
          if (sheetSession.current) sheetSession.current.stats = true;
        }}
        /* §2.2 — paging is live only while there IS a sequence to page. */
        onHorizontalDrag={pageIx != null && roundSeq.length > 1 ? pageDrag : null}
        pageShift={shift}
        hint={swipeHintOn ? t('courses:scorecard.swipeHint', 'Swipe for the next round') : null}
        /* BRIEF_ROUND_SHEET_PEEK §1 — the neighbour, drawn from the seed this
           page already holds. Query-free: no reactions, no comments, no stats.
           A round with no hole rows still shows its summary with the syncing
           middle rather than a blank panel. */
        pagePreview={pagePreview}
        /* §1 — the card's height belongs to the round, so mid is measured again
           whenever the round changes. */
        midKey={opener.target?.scoreId ?? undefined}
        /* §3 — PAGING WITHOUT A SWIPE: two hidden focusable controls, the arrow
           keys, and the polite line that names the round that arrived. */
        paging={pageIx != null && roundSeq.length > 1 ? {
          onPrev: () => pageStep('prev'),
          onNext: () => pageStep('next'),
          hasPrev: pageIx > 0,
          hasNext: pageIx < roundSeq.length - 1,
          prevLabel: t('courses:scorecard.previousRound', 'Previous round'),
          nextLabel: t('courses:scorecard.nextRound', 'Next round'),
          announce: pageAnnounce,
        } : null}
      />
    </div>
  );
}

export default ExploreMagazine;
