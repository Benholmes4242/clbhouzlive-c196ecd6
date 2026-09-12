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
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ExploreCard, type CardSize } from './ExploreCard';
import { ExploreShelf } from './ExploreShelf';
import { LeadShell, PairShell, ShelfShell, StdShell } from './ExploreShells';
import { PHASE_A_VIEWS, readExploreView, writeExploreView, type ExploreView } from './exploreViewMemory';
import { STREAM_PAGE_SIZE, useExploreStreamClient } from './useExploreStreamClient';
import type { StreamItem } from './streamItem';

/**
 * THE MAGAZINE (BRIEF_EXPLORE_MAGAZINE, PHASE A).
 *
 * One ranked stream of ONE UNIT, broken by a shelf every fourth card. The page
 * owns NO header: /amateur wears the shared floating glass islands (registry
 * rule), exactly as it did before.
 *
 * TWO CHIPS ONLY. Scores, Courses and Reviews are absent, not disabled and not
 * labelled "coming next": a control that cannot change what you see does not
 * render. They arrive with Phase B and Phase C.
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

/** §2c PHASE B1 adds `standing` at its shelf slot, after clips. An empty or
 *  unresolved standing shelf renders nothing and leaves no gap — the same path
 *  an empty clips shelf already takes. */
type ShelfKind = 'clips' | 'standing' | 'moments';

type Block =
  | { kind: 'lead'; item: StreamItem }
  | { kind: 'std'; item: StreamItem }
  | { kind: 'pair'; items: [StreamItem, StreamItem] }
  | { kind: 'shelf'; shelf: ShelfKind };

/** §6d PAIRS carry no round shape, so only kinds that never draw one pair up. */
const PAIRABLE = new Set(['review', 'course', 'story']);

/** §5 shelves are inserted after card positions 3, 7, 11 ... and an empty
 *  source means the next shelf takes the slot rather than a gap appearing. */
function buildBlocks(items: StreamItem[], shelves: Array<'clips' | 'moments'>): Block[] {
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
    } else if (next && PAIRABLE.has(item.kind) && PAIRABLE.has(next.kind) && item.kind !== next.kind) {
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

  if (!media.isFetched) return <ShelfShell tileW={CLIP_TILE.w} tileH={CLIP_TILE.h} />;
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

  if (!moments.isFetched) return <ShelfShell tileW={MOMENT_TILE.w} tileH={MOMENT_TILE.h} />;
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
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const opener = useScorecardOpener();
  const openReview = useReviewSheetStore((state) => state.open);

  const [view, setView] = useState<ExploreView>(() => readExploreView());
  const [revealed, setRevealed] = useState(STREAM_PAGE_SIZE);
  const stream = useExploreStreamClient(userId, view);

  const visible = useMemo(() => stream.items.slice(0, revealed), [stream.items, revealed]);

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

  const shelves: Array<'clips' | 'moments'> = view === 'watch' ? ['moments'] : ['clips', 'moments'];
  const blocks = useMemo(() => buildBlocks(enriched, shelves), [enriched, view]);

  /* ONE PAGE-LOADED EVENT PER REVEAL, with the REAL returned count. */
  const loggedRef = useRef(0);
  useEffect(() => {
    if (!stream.isFetched) return;
    const page = Math.ceil(visible.length / STREAM_PAGE_SIZE);
    if (page === loggedRef.current) return;
    loggedRef.current = page;
    analyticsEvents.track('amateur_stream_page_loaded', {
      page,
      returned: visible.length,
      lane_mix: 'news',
      view,
    });
  }, [stream.isFetched, visible.length, view]);

  /* §6f THE SENTINEL MEANS LOADING, NOT "MORE EXISTS". When the pool is spent it
     unmounts and the page ends at the last card. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = revealed < stream.items.length;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setRevealed((n) => n + STREAM_PAGE_SIZE);
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    if (stream.isFetched && !hasMore && stream.items.length > 0) {
      analyticsEvents.track('amateur_stream_end', { pages: Math.ceil(stream.items.length / STREAM_PAGE_SIZE), view });
    }
  }, [stream.isFetched, hasMore, stream.items.length, view]);

  const depart = useCallback(() => rememberAmateurScroll(), []);

  const changeView = useCallback(
    (next: string) => {
      const value = next as ExploreView;
      if (!PHASE_A_VIEWS.includes(value)) return;
      analyticsEvents.track('amateur_view_changed', { from: view, to: value });
      setView(value);
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
      PHASE_A_VIEWS.map((key) => ({
        id: key,
        label:
          key === 'all'
            ? t('amateur.stream.view.all', 'All')
            : t('amateur.stream.view.watch', 'Watch'),
      })),
    [t],
  );

  let cardPos = 0;

  return (
    <div style={{ fontFamily: SANS }}>
      {/* §3b THE CHIP ROW sticks JUST BENEATH the floating islands — top is
          CHROME_CLEARANCE (island bottom edge, safe-area inclusive), not 0,
          so it never pins at viewport top under the search/avatar island.
          Same grammar as Clubhouse's sticky row. The active view takes the
          FILLED ground (applied) and the rest the outline (selectable) —
          the shared RailChips grammar, not a local look-alike. */}
      <div
        style={{
          position: 'sticky',
          top: CHROME_CLEARANCE,
          zIndex: 3,
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

      {/* COLD START SHOWS THE SHORTEST PLAUSIBLE CARD, never a lead shell: a
          loading state is never larger than the state it resolves into. */}
      {!stream.isFetched && enriched.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: BLOCK_GAP, paddingInline: CARD_INSET }}>
          <StdShell />
          <StdShell />
        </div>
      ) : null}

      {stream.isFetched && stream.items.length === 0 ? (
        /* §6h THE ONE SENTENCE ON THE PAGE. No heading, no placeholder card. */
        <div style={{ paddingInline: 20, marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: A.BODY }}>
            {t(
              'amateur.stream.nothingYet',
              'Nothing here touches your courses yet. Follow a course or connect a handicap and this page becomes yours.',
            )}
          </p>
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
            return (
              <div key={`shelf:${block.shelf}:${index}`}>
                {block.shelf === 'clips' ? (
                  <ClipsShelf pos={pos} onDepart={depart} />
                ) : (
                  <MomentsShelf pos={pos} onDepart={depart} />
                )}
              </div>
            );
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
