import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MediaRailTile } from '@/components/explore-tab-new/courseled/MediaRailTile';
import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import { useDiscoverMediaPreview } from '@/components/explore-tab-new/courseled/hooks/useDiscoverMediaPreview';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { useRoundHoleShapes, type HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { RailChips } from '@/components/ui/RailChips';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { rememberAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import StickySafeAreaScrim, { useStickySafeAreaState } from '@/components/chrome/StickySafeAreaScrim';
import { Z } from '@/config/zIndex';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreCard, type CardSize } from './ExploreCard';
import { ExploreShelf } from './ExploreShelf';
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
import { STREAM_PAGE_SIZE, useExploreStreamClient } from './useExploreStreamClient';
import { useExploreStream } from './useExploreStream';
import type { StreamItem } from './streamItem';
import { WeeklyClubShelf } from './WeeklyClubShelf';
import { CourseShelf } from './CourseShelf';
import { PeopleShelf } from './PeopleShelf';
import { useCountyCourses, useListCourses, useWorldTop100Courses } from './useCourseShelves';
import { useRecentCourseRatings, useScopeCourses } from './useCoursesView';
import { useViewerScoreScope, type ScoreScope } from './useViewerScoreScope';
import { useViewerStanding } from './useViewerStanding';
import { useViewerCourseContext } from './useViewerCourseContext';
import { useFollowingIdSet } from '@/components/explore-tab-new/courseled/hooks/useFollowingIdSet';
import { WHS_CONNECT_PATH } from '@/components/header/globalHeaderRules';

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

const CLIP_TILE = { w: 118, h: 210 };
const MOMENT_TILE = { w: 132, h: 132 };

/** ONE frozen empty map, so an unresolved shape source is a stable identity
 *  rather than a new object (and a new render) on every pass. */
const EMPTY_SHAPES: Map<string, HoleShape> = new Map();

/** §3e PHASE C — THE FINAL ALL ORDER, skipping empties: clips, rounds (this week
 *  at the club), standing, courses:county, moments, people, courses:world,
 *  courses:list. An empty or unresolved shelf renders nothing and leaves no gap,
 *  which is the same path an empty clips shelf already takes. */
type ShelfKind =
  | 'clips'
  | 'clubWeek'
  | 'standing'
  | 'coursesCounty'
  | 'moments'
  | 'people'
  | 'coursesWorld'
  | 'coursesList'
  /** §5b PHASE C C3 — courses:top-rated, the one NEW shelf of this step. The
   *  county and world course shelves already exist from C1 and are REUSED. */
  | 'coursesTopRated';

type Block =
  | { kind: 'lead'; item: StreamItem }
  | { kind: 'std'; item: StreamItem }
  | { kind: 'pair'; items: [StreamItem, StreamItem] }
  | { kind: 'shelf'; shelf: ShelfKind };

/** §6d PAIRS carry no round shape, so only kinds that never draw one pair up. */
const PAIRABLE = new Set(['review', 'course', 'story']);

/** §5 shelves are inserted after card positions 3, 7, 11 ... and an empty
 *  source means the next shelf takes the slot rather than a gap appearing.
 *
 *  §5b/§5c A SINGLE-TYPE VIEW PAIRS ITS OWN KIND. The mixed stream refuses two
 *  cards of the same kind side by side, because there it would read as one
 *  repeated card; the Courses and Reviews views are all one kind by definition
 *  and the brief allows pairs in both, so `sameKindPairs` opens that door for
 *  those two views only. */
function buildBlocks(items: StreamItem[], shelves: ShelfKind[], sameKindPairs = false): Block[] {
  const blocks: Block[] = [];
  let cards = 0;
  let nextShelf = 0;
  let index = 0;

  while (index < items.length) {
    const item = items[index];
    const next = items[index + 1];

    if (cards === 0) {
      blocks.push({ kind: 'lead', item });
      index += 1;
      cards += 1;
    } else if (
      next &&
      PAIRABLE.has(item.kind) &&
      PAIRABLE.has(next.kind) &&
      (sameKindPairs || item.kind !== next.kind)
    ) {
      blocks.push({ kind: 'pair', items: [item, next] });
      index += 2;
      cards += 2;
    } else {
      blocks.push({ kind: 'std', item });
      index += 1;
      cards += 1;
    }

    if (cards >= 3 + nextShelf * 4 && nextShelf < shelves.length) {
      blocks.push({ kind: 'shelf', shelf: shelves[nextShelf] });
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
      seeAllLabel={t('amateur.stream.seeAll', 'See all {{count}}', { count: clips.length })}
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
      seeAllLabel={t('amateur.stream.seeAll', 'See all {{count}}', { count: tiles.length })}
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
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const openReview = useReviewSheetStore((state) => state.open);

  const [view, setView] = useState<ExploreView>(() => readExploreView());
  const geography = useViewerScoreScope(userId);
  /* §1 ONE SCOPE, ONE COMPONENT, THREE VIEWS. Scores, Courses and Reviews all
     read the SAME scope state from the SAME shared resolver; All and Watch never
     show the row. The default on entry is My club where it resolves, else the
     county, else World with no row at all. */
  const scoped = SCOPED_VIEWS.includes(view);
  const [scoreScope, setScoreScope] = useState<ScoreScope>('world');
  const scoreScopeChosen = useRef(false);
  useEffect(() => {
    if (!scoped || !geography.isFetched || scoreScopeChosen.current) return;
    setScoreScope(geography.scope.primaryClubId ? 'club' : geography.scope.county ? 'county' : 'world');
    scoreScopeChosen.current = true;
  }, [scoped, geography.isFetched, geography.scope.primaryClubId, geography.scope.county]);
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
  const serverView = view !== 'watch';
  const serverReady = serverView && (!scoped || geography.isFetched);
  const server = useExploreStream(userId && serverReady ? userId : undefined, view, scoreScope, {
    clubId: geography.scope.primaryClubId,
    county: geography.scope.county,
    country: geography.scope.country,
  });
  const serverOn = serverView && !server.unavailable && server.isFetched && server.items.length > 0;
  /* THE FALLBACK CONDITION, in one place. While the RPC is still in flight the
     client composition is NOT fetched - the server hook shows its own shells, so
     a member never pays for two rankers. */
  const fallbackWanted = !serverView || server.unavailable;
  const stream = useExploreStreamClient(
    fallbackWanted ? userId : undefined,
    view,
    { active: scoreScope, geography: geography.scope },
    { enabled: fallbackWanted },
  );
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
    scoreScope,
    geography.scope,
    /* THE FALLBACK ONLY. With the RPC serving Courses this composition is not
       fetched at all; it wakes up if the server read is unavailable. */
    view === 'courses' && geography.isFetched && !serverOn,
  );
  /* THE VIEW'S SOURCE, in one place: everything below reads `source`, so a
     single-type view and the mixed stream take the same reveal, sentinel,
     page-loaded and end paths. */
  const source = serverOn ? server : view === 'courses' ? coursesView : stream;

  /* PHASE C §3a-§3c THE COURSE SHELVES. Each shelf renders nothing when its
     source is empty. Geography comes from the shared resolver above — no second
     derivation, and C1's county and world shelves are REUSED here, not rebuilt. */
  const shelvesWanted = view === 'all' || view === 'courses' || view === 'reviews';
  const countyCourses = useCountyCourses(userId, geography.scope, shelvesWanted && geography.isFetched);
  const worldCourses = useWorldTop100Courses(shelvesWanted);
  const listCourses = useListCourses(userId, shelvesWanted);
  /* §5a THE LIST SHELF'S SECOND LINE reads the events the ranker already
     computed for the rows on this page - no per-tile query. A course with no
     event, or with a tie between two kinds, keeps its AREA. */
  const listEvents = useMemo(() => listCourseEvents(source.items), [source.items]);
  const topRatedCourses = useRecentCourseRatings(view === 'courses' || view === 'reviews');

  /* THE SERVER PAGE IS ALREADY A PAGE. Reveal slicing belongs to the client
     composition only; re-slicing a ranked, cadenced page would hide cards the
     RPC deliberately placed. */
  const visible = useMemo(
    () => (serverOn ? source.items : source.items.slice(0, revealed)),
    [serverOn, source.items, revealed],
  );

  /* THE COURSE IMAGE AND REGION ARRIVE IN ONE ROUND TRIP for every card on
     screen, and a card holds its whole shell until that resolver settles —
     `pending` is never a gradient standing in for an unknown. */
  const courseIds = useMemo(
    () => visible.map((item) => item.subject?.course_id).filter((id): id is string => !!id),
    [visible],
  );
  const meta = useCourseCardMeta(courseIds);
  /* useRoundHoleShapes RETURNS `Map | null` — null while the read is in flight,
     disabled, or unreachable. UNRESOLVED IS NOT ABSENT and it is never a crash:
     the map is coerced to an EMPTY Map here, a missing key yields no shape, and
     the card draws its own fallback curve. The other three callers of this hook
     already read it optionally; this one did not, which is the `.get` on null
     that took /amateur to the error boundary. */
  const shapesMap = useRoundHoleShapes(useMemo(() => visible.map((item) => item.facts.score_id ?? null), [visible]));
  const shapes = useMemo(() => shapesMap ?? EMPTY_SHAPES, [shapesMap]);

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

  /* §3e THE ALL ORDER, in one place. Page 3+ restarts from clips, which the
     modulo in the renderer does; an empty shelf is skipped by the shelf itself
     and the next one takes its slot. */
  const ALL_SHELVES: ShelfKind[] = [
    'clips',
    'clubWeek',
    'standing',
    'coursesCounty',
    'moments',
    'people',
    'coursesWorld',
    'coursesList',
  ];
  /* §5b THE COURSES SHELF ORDER, skipping empties: list first where the viewer
     has one, then county, then the new top-rated shelf, then world — and world
     ONLY where the scope has already widened past the county (§5b).
     §5c REVIEWS: top-rated, then list. */
  const COURSES_SHELVES: ShelfKind[] = [
    'coursesList',
    'coursesCounty',
    'coursesTopRated',
    ...(scoreScope === 'country' || scoreScope === 'world' ? (['coursesWorld'] as ShelfKind[]) : []),
  ];
  const REVIEWS_SHELVES: ShelfKind[] = ['coursesTopRated', 'coursesList'];
  const shelves: ShelfKind[] =
    view === 'watch'
      ? ['moments']
      : view === 'scores'
        ? []
        : view === 'courses'
          ? COURSES_SHELVES
          : view === 'reviews'
            ? REVIEWS_SHELVES
            : ALL_SHELVES;
  const singleType = view === 'courses' || view === 'reviews';
  const blocks = useMemo(() => buildBlocks(enriched, shelves, singleType), [enriched, view, scoreScope, singleType]);

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
      writeExploreView(value);
      setRevealed(STREAM_PAGE_SIZE);
      loggedRef.current = 0;
      /* A view is not a route: no history entry, no scroll animation. */
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [view],
  );

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
        opener.openByScore(item.facts.score_id, item.facts.connection_id ?? null, item.who?.user_id ?? null);
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
    [depart, navigate, openReview, opener, t],
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
   *  are DATA; "your club" and "the world" are the only translated ones. */
  const scopeName =
    scoreScope === 'club'
      ? geography.scope.primaryClubName ?? t('amateur.stream.scope.yourClub', 'your club')
      : scoreScope === 'county'
        ? geography.scope.county ?? t('amateur.stream.scope.theWorld', 'the world')
        : scoreScope === 'country'
          ? geography.scope.country ?? t('amateur.stream.scope.theWorld', 'the world')
          : t('amateur.stream.scope.theWorld', 'the world');
  /* A SCOPE WITH NO CARDS BUT SHELVES WITH CONTENT RENDERS THE SHELVES AND NO
     SENTENCE (§5d). The shelves each report their own emptiness. UNSETTLED IS
     NOT EMPTY: while any shelf source is still in flight the sentence is held
     back, so a scope that does have shelves never flashes "nothing here". */
  const shelvesSettled =
    listCourses.isFetched && countyCourses.isFetched && topRatedCourses.isFetched && worldCourses.isFetched;
  const shelvesHaveContent =
    (listCourses.rows.length > 0) ||
    (countyCourses.rows.length > 0) ||
    (topRatedCourses.rows.length > 0) ||
    ((scoreScope === 'country' || scoreScope === 'world') && worldCourses.rows.length > 0);

  /** ONE SHELF RENDERER, TWO CALLERS (§5d): the stream's every-fourth-card slot
   *  and the shelf-only state of an empty scope. A shelf reports its own
   *  emptiness in both. */
  const renderShelf = (shelf: ShelfKind, pos: number) => (
    <>
      {shelf === 'clips' ? (
                  <ClipsShelf pos={pos} onDepart={depart} />
                ) : shelf === 'clubWeek' ? (
                  /* THE SAME SHELF THE SCORES VIEW USES — reused, not copied. */
                  <WeeklyClubShelf
                    viewerId={userId}
                    clubName={geography.scope.primaryClubName}
                    enabled={!!geography.scope.primaryClubId}
                    pos={pos}
                  />
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
                  <CourseShelf
                    heading={t('amateur.shelf.aroundWorld', 'Around the world')}
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
          <RailChips
            options={chips}
            value={view}
            onChange={changeView}
            ariaLabel={t('amateur.stream.views', 'Explore views')}
            ground="filled"
          />
        </div>
      </div>

      {/* §1 THE SAME SCOPE ROW, THE SAME COMPONENT, for Scores, Courses and
          Reviews. It does not render at all where neither a club nor a county
          resolves, and the view is then World. */}
      {scoped && geography.isFetched && (geography.scope.primaryClubId || geography.scope.county) ? (
        <div style={{ padding: '0 12px 14px', minWidth: 0, overflow: 'hidden' }}>
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
          />
        </div>
      ) : null}

      {view === 'scores' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: BLOCK_GAP, marginBottom: BLOCK_GAP }}>
          {!scoresStanding.isFetched ? <ShelfShell tileW={206} tileH={118} /> : null}
          {scoresStanding.isFetched && !scoresStanding.unresolved && scoresStanding.rows.length > 0 ? (
            <StandingShelf viewerId={userId} pos={0} />
          ) : null}
          {scoresStanding.isFetched && !scoresStanding.unresolved && scoresStanding.rows.length === 0 ? (
            <div style={{ paddingInline: 20 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: A.BODY }}>
                {t('amateur.stream.connect.body', 'Connect a handicap and every round you play lands here, ranked against everyone who has played the same course.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  analyticsEvents.track('amateur_connect_tapped', { from: 'scores_sentence' });
                  depart();
                  navigate(WHS_CONNECT_PATH);
                }}
                style={{ border: 0, background: 'transparent', padding: '8px 0 0', color: A.INK, fontFamily: SANS, fontSize: 13, fontWeight: 700 }}
              >
                {t('amateur.stream.connect.action', 'Connect a handicap >')}
              </button>
            </div>
          ) : null}
          <WeeklyClubShelf
            viewerId={userId}
            clubName={geography.scope.primaryClubName}
            enabled={(scoreScope === 'club' || scoreScope === 'county') && !!geography.scope.primaryClubId}
            pos={0}
          />
          {/* §4 THE PEOPLE SHELF MOUNTS IN BOTH VIEWS. In Scores it belongs to
              the club and county scopes, which are the scopes that have a club. */}
          <PeopleShelf
            viewerId={userId}
            clubId={geography.scope.primaryClubId}
            clubName={geography.scope.primaryClubName}
            enabled={geography.isFetched && (scoreScope === 'club' || scoreScope === 'county')}
            pos={0}
          />
        </div>
      ) : null}

      {/* COLD START SHOWS THE SHORTEST PLAUSIBLE CARD, never a lead shell: a
          loading state is never larger than the state it resolves into. */}
      {!source.isFetched && enriched.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: BLOCK_GAP, paddingInline: CARD_INSET }}>
          <StdShell />
          <StdShell />
        </div>
      ) : null}

      {singleType && source.isFetched && source.items.length === 0 ? (
        /* §5d NEVER A BLANK VIEW. Where the shelves carry content they render and
           the sentence stays away; where the scope is empty of EVERYTHING there
           is exactly ONE sentence, and the scope row above it stays so the
           member can widen. */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: BLOCK_GAP }}>
          {shelves.map((shelf) => (
            <div key={`empty-shelf:${shelf}`}>{renderShelf(shelf, 0)}</div>
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
        {blocks.map((block, index) => {
          if (block.kind === 'shelf') {
            const pos = cardPos;
            return <div key={`shelf:${block.shelf}:${index}`}>{renderShelf(block.shelf, pos)}</div>;
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
                  <ExploreCard
                    key={item.id}
                    item={item}
                    size="pair"
                    onTap={() => tapCard(item, 'pair', base + offset)}
                    onWhoTap={item.who?.user_id ? () => tapWho(item) : undefined}
                  />
                ))}
              </div>
            );
          }

          const item = block.item;
          const pos = cardPos;
          cardPos += 1;
          const size: CardSize = block.kind === 'lead' ? 'lead' : 'std';
          return (
            <div key={item.id} style={{ paddingInline: CARD_INSET }}>
              <ExploreCard
                item={item}
                size={size}
                shape={item.facts.score_id ? shapes.get(item.facts.score_id) ?? null : null}
                onTap={() => tapCard(item, size, pos)}
                onWhoTap={item.who?.user_id ? () => tapWho(item) : undefined}
              />
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
    </div>
  );
}

export default ExploreMagazine;
