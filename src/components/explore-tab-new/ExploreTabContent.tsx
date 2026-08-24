import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useDiscoverLastSeen,
  useMarkDiscoverSeenOnExit,
} from '@/hooks/useDiscoverLastSeen';

import { useDiscoverWire, type WireEvent } from './hooks/useDiscoverWire';
import { crownCategoryLabel } from '@/lib/crownCategoryLabel';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { FindGolfersSheet } from './FindGolfersSheet';
import { GolfThisWeek } from './courseled/GolfThisWeek';
import { DiscoverHero } from './courseled/DiscoverHero';
import { useDiscoverHero } from './courseled/hooks/useDiscoverHero';
import {
  DEFAULT_WEEK_SCOPE,
  type WeekScope,
} from './courseled/hooks/useGolfThisWeek';
import type { RegionSelection } from './courseled/hooks/useWeekRegionCounts';
import { GolfThisWeekSheet } from './GolfThisWeekSheet';


import { ClipsRail, LatestVideosRail } from './courseled/CommunityMediaRails';
import { useCommunityVideos } from './courseled/hooks/useCommunityVideos';
import { MediaActBar, type MediaChipId } from './courseled/MediaActBar';
import { ProgressiveReveal } from './courseled/ProgressiveReveal';
import { ACT_GAP, CHIP_GAP, Eyebrow, HEAD_GAP, InkAction, PAGE_GUTTER, RHYTHM } from './courseled/tokens';
import {
  useCommunityLibrary,
  type CommunityLibraryItem,
} from './courseled/hooks/useCommunityLibrary';
import { CommunityPhotoMosaic } from './courseled/community/CommunityPhotoMosaic';
import { CommunityCourseIndex } from './courseled/community/CommunityCourseIndex';
import { CommunityClipMosaic } from './courseled/community/CommunityClipMosaic';
import { CommunityVideoRow } from './courseled/community/CommunityVideoRow';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { mediaTarget } from '@/utils/mediaEngagement';
import { MostPlayedLeaderboard } from './courseled/MostPlayedLeaderboard';
import { MostPlayedSheet } from './courseled/MostPlayedSheet';

import {
  HonoursBoard,
  sortHonours,
  type HonoursMode,
} from './courseled/HonoursBoard';
import { HonoursBoardSheet } from './courseled/HonoursBoardSheet';
import { useMostPlayedThisWeek, type MostPlayedPlayer, type MostPlayedRow } from './courseled/hooks/useMostPlayedThisWeek';


/**
 * Discover, COURSE-LED (BRIEF_DISCOVER_REBUILT_COURSE_LED).
 *
 * The page flips from person-led to course-led: every story is framed "at this
 * course, this is what happened". The course card is the atom — image, dark
 * scrim, name and region, a when-chip, event lines stacked beneath.
 *
 * Vertical space is curated and capped; horizontal rails absorb volume, so a
 * heavy week grows sideways rather than pushing the discovery feed off screen.
 *
 * RENDER ORDER (BRIEF_DISCOVER_ORDER_AND_LABELS §1): the RANKED sections come
 * before the MEDIA rails.
 *
 *   1 the tab pills
 *   2 Golf this week              rounds rail   headless, owns the safe area
 *   3 Most played courses         leaderboard
 *   4 The honours board           board         never windowed
 *   5 Latest videos               rail
 *   6 Clips                       rail
 *   7 the bottom-nav spacer
 *
 * =====================================================================
 * THE SCOPE PILLS ONLY GOVERN THE DATA (BRIEF_DISCOVER_ABSORBS_COMMUNITY §0).
 *
 * Your Circle / Suggested / Top 100 / Played / Worldwide filter ROUNDS. A clip
 * is not "in your circle". So this page is TWO ACTS WITH A VISIBLE SEAM, and the
 * seam is where the pills' authority ends. Anything below it is unscoped and
 * must LOOK unscoped.
 *
 * EVERY FUTURE SECTION ADDED HERE ANSWERS THAT QUESTION FIRST: which side of the
 * seam does it belong on? A media rail placed in act one quietly breaks the
 * promise the pills make, and nothing in the code would complain.
 *
 *   ACT ONE   governed by the scope pills, and bounded to the week
 *     1 the page hero
 *     2 the readout and the scope pills
 *     3 the four leader tiles      } inside GolfThisWeek
 *     4 the round tiles rail       }
 *     5 courses played this week
 *   THE SEAM  ALL TIME - FROM EVERYONE
 *   ACT TWO   governed by nothing above it
 *     6 the honours board          the hinge: data, so it speaks act one's
 *                                  language; all-time and unscoped, so it obeys
 *                                  act two's rules
 *     7 photos
 *     8 clips
 *     9 latest videos
 *    10 browse by club             navigational, not content, so it is last
 *
 * /community IS NO LONGER NAVIGATED TO; it survives as the destination behind
 * every act two "see all" (§3). Its route, page and media filter pills are
 * untouched. THOSE FILTER PILLS DO NOT COME HERE: two pill rows on one page,
 * one scoping rounds and one scoping media, is §0's ambiguity made literal.
 *
 * ON TOUR THIS WEEK, LATEST REVIEWS, the rate prompt and FROM THE COMMUNITY
 * were each removed from this page deliberately. Photos are back — as the lead
 * of act two, not as an act one section.
 *
 * The "This week on clbhouz" pulse band from the signed-off mock is REMOVED per
 * the brief and must not be reinstated.
 *
 * A FILTER GOVERNS WHAT IS BELOW IT AND NOTHING ELSE. The scope pills govern
 * act one's data. The media chips govern the media sections beneath them. NO
 * CONTROL ON THIS PAGE MAY EVER REACH BACKWARDS PAST ITSELF.
 */

/**
 * ON 'EVERYTHING', EVERY MEDIA SECTION SHOWS A SAMPLE (BRIEF_DISCOVER_ONE_PAGE
 * §3.4). Twelve photos is two full mosaic rows plus a third that is visibly cut
 * off — enough to read as a wall, short enough that browse by club is still
 * reachable. The rails cap themselves at MAX_RAIL_TILES.
 *
 * NOTHING IS UNREACHABLE ANY MORE, WHICH IS THE POINT: with /community deleted a
 * cap with no way past it would hide 157 of 169 photos permanently. The chips
 * ARE the way past it — a type chip drops the cap and the section grows in place
 * on scroll (ProgressiveReveal). Every former "see all" now switches a chip
 * instead of navigating.
 */
const PHOTOS_SAMPLE = 12;

/**
 * BOTH SIDES OF THE MEDIA SEARCH ARE NORMALISED the same way: trimmed,
 * lowercased and stripped of diacritics, because course and member names carry
 * accents and a member typing "jose" should reach "José".
 */
function normaliseForSearch(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * The clip reveal step. Photos do not have one here: CommunityPhotoMosaic owns
 * its own STEP internally, because it fills two columns by index and a wrapper
 * slicing the pool would fight it.
 */
const CLIP_STEP = 24;

interface ExploreTabContentProps {
  embedded?: boolean;
  shellTabs?: React.ReactNode;
}

export default function ExploreTabContent({
  embedded: _embedded = false,
  shellTabs,
}: ExploreTabContentProps) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;

  // NEW SINCE (BRIEF_DISCOVER_NEW_SINCE): one baseline for the whole visit,
  // written back only on EXIT so markers survive scrolling and tapping.
  const { markSeen } = useDiscoverLastSeen(userId);

  useMarkDiscoverSeenOnExit(markSeen);

  /* ONE ROUNDS SECTION (BRIEF_MERGE_CIRCLE_AND_GOLF_THIS_WEEK §S1). Your Circle
     and Golf this week were the same section shown twice; the merged rail keeps
     its scope and area here so the see-all sheet inherits both. Component state,
     not the URL: a filter tap must not enter the back stack. */
  const [weekScope, setWeekScope] = useState<WeekScope>(DEFAULT_WEEK_SCOPE);
  const [weekRegion, setWeekRegion] = useState<RegionSelection | null>(null);

  // Sticky-bar veil: mirrors CoursesContent so the notch strip paints the
  // moment the pills pin (no gap, no colour seam).
  const lensSentinelRef = useRef<HTMLDivElement | null>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  useEffect(() => {
    setTabsStuck(window.scrollY > 200);
    const el = lensSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setTabsStuck(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The pool is unchanged: ONE 90-day fetch, worldwide. The lenses are
  // client-side filters and ordering over data already loaded.
  const { events: pool, legendary, isPending: wireLoading } = useDiscoverWire(
    null,
    userId,
    crownCategoryLabel,
  );

  // THE MOMENTS MOSAIC LEFT THIS PAGE (MICRO_BRIEF_REMOVE_MOMENTS_FROM_DISCOVER):
  // useMomentsOfTheWeek is no longer read here. It still serves the Community page.

  // THE MEDIA RAILS ARE NOT COURSE-LED (BRIEF_DISCOVER_MEDIA_RAILS §0.2): this
  // reads the whole media library, unfiltered by course tag and by `lens`.
  const communityVideos = useCommunityVideos();
  /* ACT TWO'S PHOTOS AND CLUBS read the WHOLE library (all-time, untagged,
     newest first) — the same hook the /community destination reads, so the
     sample and the full pool can never disagree. */
  const library = useCommunityLibrary();
  const mostPlayedQuery = useMostPlayedThisWeek();

  const mostPlayed = mostPlayedQuery.data;

  const [golfWeekSheet, setGolfWeekSheet] = useState(false);
  const [findGolfers, setFindGolfers] = useState(false);
  const [mostPlayedSheet, setMostPlayedSheet] = useState(false);
  const [honoursSheet, setHonoursSheet] = useState(false);
  const [honoursMode, setHonoursMode] = useState<HonoursMode>('recent');
  const [honoursFocus, setHonoursFocus] = useState<string | null>(null);

  /**
   * LATEST REVIEWS LEFT THIS PAGE (BRIEF_REVIEWS_TO_COURSES_AND_TOUR_REMOVAL
   * S2). The section, its pool hook and the see-all trigger are all gone from
   * Discover; LatestReviewsSheet itself is untouched and is now opened from the
   * Courses browse, where the review pool is country/region scoped.
   */

  const mostPlayedList = useMemo(() => mostPlayed ?? [], [mostPlayed]);


  const handleScopeChange = useCallback(
    (next: WeekScope) => {
      if (next === weekScope) return;
      analyticsEvents.track('discover_lens_change', { lens: next });
      /* A SCOPE CHANGE RESETS THE AREA (§S3.5): the counts belong to the scope,
         so an area holding nothing under the new pill must not survive it. */
      setWeekScope(next);
      setWeekRegion(null);
    },
    [weekScope],
  );

  /**
   * THE LENS MACHINERY MOVED INTO THE SECTION (BRIEF_GOLF_THIS_WEEK §3). The
   * pool filters, priority ordering, shortlist overlay and lens empty copy all
   * belonged to Around the world, which is deleted; Golf this week resolves its
   * own membership sets over the course ids of the rounds it actually holds, and
   * the pills are rendered into it. `useDiscoverWire` survives here only for the
   * honours board's `legendary` list.
   */

  // Every course-led surface ROUTES to the course page: it is a different
  // surface with its own job. Sheets are only for bounded sets.
  const goCourse = useCallback(
    (courseId: string, section: string) => {
      analyticsEvents.track('discover_course_card_tapped', { course_id: courseId, section });
      navigate(`/courses/${courseId}`);
    },
    [navigate],
  );

  /* THE PAGE HERO (BRIEF_DISCOVER_WORLD_CLASS §1). It reads the SAME cached
     queries the rounds section reads — zero new network requests — and returns
     null when every round in the window is PLAIN, in which case NOTHING renders
     and NO HEIGHT IS RESERVED: the page then opens exactly as it did before
     (ACCEPTANCE c). The hero is CONTENT; the readout and the scope pills stay
     beneath it inside the section, where they were (§1.5). */
  const hero = useDiscoverHero(userId, weekScope, weekRegion);

  const opener = useScorecardOpener();
  const handleFriendCard = useCallback(
    (r: CircleRoundRow) => {
      analyticsEvents.track('discover_friend_round_tapped', {
        course_id: r.course_id ?? null,
        has_score: !!r.score_id,
        // BRIEF_WHOS_BEEN_PLAYING 5.1 — is a stranger's round ever opened?
        suggested: r.suggested,
      });
      if (r.score_id) opener.openByScore(r.score_id, r.connection_id, r.user_id);
      else if (r.course_id) navigate(`/courses/${r.course_id}`);
      else opener.openProfile(r.user_id);
    },
    [navigate, opener],
  );




  const handleMostPlayed = useCallback(
    (r: MostPlayedRow) => goCourse(r.courseId, 'most_played'),
    [goCourse],
  );

  /* A BOARD ROW IS A ROUND: it opens the scorecard bottom sheet, the same one
     the round tiles and the honours board open. The row carries the score id of
     the exact round the board is showing, and the component only calls this when
     that id exists. */
  const handleMostPlayedPlayer = useCallback(
    (p: MostPlayedPlayer) => {
      analyticsEvents.track('discover_most_played_row_tapped', {
        has_score: !!p.scoreId,
      });
      if (p.scoreId) opener.openByScore(p.scoreId, null, p.userId);
    },
    [opener],
  );

  /**
   * PHOTOS LEAD THE MEDIA (§1.2), and the reasoning is recorded so it is not
   * reversed on a hunch: photos are the only media section that contains the
   * member's OWN CIRCLE — their friends' faces, their own courses. Clips and
   * videos are mostly other people's golf. On a page whose first act is entirely
   * about your circle, the section that continues that thought should open the
   * second. Photos are also the cheapest to consume (no tap, no audio, no
   * commitment) and the densest per pixel, which earns the scroll to the clips.
   *
   * THIS IS A REASONED PRIOR, NOT A MEASUREMENT. AUDIT_MEDIA_ENGAGEMENT found
   * the data cannot currently support a ranking of photos against clips against
   * videos; BRIEF_MEDIA_TRACKING_MINIMUM shipped the two events that will settle
   * it. Reorder this on those numbers, not on taste.
   */
  const allPhotoPool = useMemo(() => library.data?.photos ?? [], [library.data]);
  const libraryAll = useMemo(() => library.data?.all ?? [], [library.data]);
  const allClipPool = useMemo(() => library.data?.clips ?? [], [library.data]);
  const allVideoPool = useMemo(() => library.data?.videos ?? [], [library.data]);

  /**
   * THE MEDIA SEARCH IS AN INLINE FILTER OVER THESE POOLS
   * (MICRO_BRIEF_DISCOVER_MEDIA_SEARCH_INLINE §2). No hook, no query key, no
   * network path: the pools are already client-side, so the match happens here,
   * where the data lives. MediaActBar is a control, not a data owner.
   *
   * IT GOVERNS ONLY WHAT IS BELOW THE BAR. photoPool, clipPool and videoPool —
   * nothing else. The honours board is a preceding sibling and is outside
   * data-media-filter-scope, so this state cannot reach it.
   *
   * MINIMUM 2 CHARACTERS, DEBOUNCED 200ms: one letter matches nearly every
   * caption (the page would appear to do nothing), and three mosaics should not
   * re-render on every keystroke.
   *
   * courseName IS DELIBERATELY NOT MATCHED. It resolves on 6 posts out of 242
   * (useCommunityVideos.ts:54), and a field that silently matches almost nothing
   * makes search feel broken rather than empty.
   */
  const [mediaQuery, setMediaQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(mediaQuery), 200);
    return () => window.clearTimeout(id);
  }, [mediaQuery]);

  const needle = useMemo(() => normaliseForSearch(debouncedQuery), [debouncedQuery]);
  const filtering = needle.length >= 2;

  const matchMedia = useCallback(
    (items: CommunityLibraryItem[]) =>
      filtering
        ? items.filter(
            (i) =>
              normaliseForSearch(i.title).includes(needle) ||
              normaliseForSearch(i.displayName).includes(needle),
          )
        : items,
    [filtering, needle],
  );

  const photoPool = useMemo(() => matchMedia(allPhotoPool), [matchMedia, allPhotoPool]);
  const clipPool = useMemo(() => matchMedia(allClipPool), [matchMedia, allClipPool]);
  const videoPool = useMemo(() => matchMedia(allVideoPool), [matchMedia, allVideoPool]);
  const photoSample = useMemo(() => photoPool.slice(0, PHOTOS_SAMPLE), [photoPool]);
  const noMediaMatches =
    filtering && photoPool.length === 0 && clipPool.length === 0 && videoPool.length === 0;


  /**
   * THE MEDIA CHIP (BRIEF_DISCOVER_ONE_PAGE §4.2). Component state, never the
   * URL — the same rule /community held and the same rule the scope pills hold:
   * a filtered view is not a place a member should land on cold, and a chip tap
   * must not enter the back stack.
   */
  const [mediaChip, setMediaChip] = useState<MediaChipId>('all');
  const changeChip = useCallback(
    (next: MediaChipId) => {
      if (next === mediaChip) return;
      analyticsEvents.media.filterSelected(next, mediaChip);
      setMediaChip(next);
    },
    [mediaChip],
  );

  /**
   * THE VIEWER'S QUEUE IS WHAT THE MEMBER CAN SEE (unchanged rule): swiping
   * inside the fullscreen viewer walks the pool this section actually rendered,
   * so the queue can never contain something the page does not show.
   */
  const openMedia = useCallback(
    (pool: CommunityLibraryItem[], item: CommunityLibraryItem, openedFrom: string) => {
      const posts = pool.map((i) => i.post);
      const index = Math.max(0, posts.findIndex((post) => post.id === item.postId));
      openWithOrigin({
        posts,
        index,
        originEl: null,
        posterUrl: item.thumbnail,
        mediaIndex: item.mediaIndex ?? 0,
        mediaId: item.mediaId ?? null,
        openedFrom,
      });
    },
    [],
  );

  /* WHILE FILTERING, PHOTOS DO NOT SAMPLE (§3): showing 12 of a filtered set
     would make the result count a lie. Every match renders. */
  const photosShown = filtering || mediaChip === 'photos' ? photoPool : photoSample;
  const handlePhoto = useCallback(
    (item: CommunityLibraryItem) => openMedia(photosShown, item, 'discover-photos'),
    [openMedia, photosShown],
  );
  const handleClip = useCallback(
    (item: CommunityLibraryItem) => openMedia(clipPool, item, 'discover-clips'),
    [openMedia, clipPool],
  );
  const handleVideo = useCallback(
    (item: CommunityLibraryItem) => openMedia(videoPool, item, 'discover-videos'),
    [openMedia, videoPool],
  );


  const honours = useMemo(() => sortHonours(legendary), [legendary]);

  const handleHonoursRow = useCallback(
    (e: WireEvent) => {
      analyticsEvents.track('discover_honours_row_tap', {
        kind: e.kind,
        year: new Date(e.at).getFullYear(),
        course_id: e.courseId ?? null,
      });
      if (e.scoreId) opener.openByScore(e.scoreId, null, e.userId);
    },
    [opener],
  );

  const openHonoursSheet = useCallback(() => {
    analyticsEvents.track('discover_honours_sheet_open', { total: honours.length });
    setHonoursMode('recent');
    setHonoursFocus(null);
    setHonoursSheet(true);
  }, [honours.length]);

  /* BRIEF_HONOURS_BOARD_THE_HOLE §S4.1 — the rail no longer groups by member,
     so there is no "{{n}} more" affordance and no leader-focused open. The
     sheet still accepts a focus id; nothing on this page supplies one. */

  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh', fontFamily: SANS, ...FIGS }}>
      <div>{shellTabs}</div>

      <GlassHeaderPlate visible={tabsStuck} />

      {/* The chrome island floats over the page, so the header clears the notch
          plus the island itself — Discover no longer sits under a hero.
          The safe-area padding now lives inside GolfThisWeek's first row
          (MICRO_BRIEF_ROUNDS_SECTION_CHROME S1.4).
          The rate prompt was removed from Discover deliberately. Nothing prompts
          a rating anywhere now - watch the review rate. */}
      {hero.subject && (
        /* FULL-BLEED: no page gutter, above everything except the chrome, which
           floats over it. The hero pays the notch + island clearance itself, so
           the rounds section drops its own (chromeClearance={false}). */
        <DiscoverHero
          subject={hero.subject}
          onPress={() => handleFriendCard(hero.subject!.row)}
        />
      )}
      {/* Match Course Detail's immersive order: hero first, then the sentinel.
          This keeps the image at physical y=0 and raises the notch veil only
          after the hero has scrolled away. */}
      <div ref={lensSentinelRef} style={{ height: 1 }} aria-hidden />

      <div
        style={{
          padding: '0 14px',
          // ONE SECTION RHYTHM: the rounds section sits outside the flex wrapper
          // below, so it must carry its own 28px to the first ranked section.
          marginBottom: 28,
          // The hero owns the notch when it renders; the section then needs an
          // ordinary gap above its readout instead of a clearance.
          marginTop: hero.subject ? 20 : 0,
        }}
      >
        <GolfThisWeek
          chromeClearance={!hero.subject}
          userId={userId}
          scope={weekScope}
          onScopeChange={handleScopeChange}
          region={weekRegion}
          onRegionChange={setWeekRegion}
          onCardPress={handleFriendCard}
          onSeeAll={() => setGolfWeekSheet(true)}
        />
      </div>

      {/* ONE SECTION RHYTHM, ONE CONSTANT (BRIEF_DISCOVER_ONE_PAGE §6): RHYTHM
          between a section's content and the next section's eyebrow. Eyebrows own
          their own HEAD_GAP to their content. */}
      <div
        style={{
          padding: `0 ${PAGE_GUTTER}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: RHYTHM,
        }}
      >
        {/* BRIEF_DISCOVER_ORDER_AND_LABELS §1 — the RANKED sections precede the
            MEDIA sections. */}
        <MostPlayedLeaderboard
          rows={mostPlayedList}
          isPending={mostPlayedQuery.isPending}
          onRowPress={handleMostPlayed}
          onPlayerPress={handleMostPlayedPlayer}
          onSeeAll={mostPlayedList.length > 5 ? () => setMostPlayedSheet(true) : undefined}
        />

        {/* 6 — THE HINGE (§1.1). Data, so it speaks act one's language; all-time
            and unscoped, so it sits on the join without lying about which side it
            is on. It stays ABOVE the media bar because a chip row that heads it
            would imply the honours board is a media type.
            It is structurally outside the media-controlled subtree below. */}
        <div data-act-one-honours style={{ display: 'contents' }}>
          <HonoursBoard
            events={honours}
            isPending={wireLoading}
            onRowPress={handleHonoursRow}
            limit={20}
            onSeeAll={openHonoursSheet}
          />
        </div>

        {/* THE CHAPTER BREAK IS NOW A CONTROL (§4). ActSeam is deleted: a
            decorative rule with a caption that had to explain itself is a rule
            that failed. ACT_GAP above and below, so the break reads as a break
            rather than as another section. */}
        <div
          data-media-act-controls
          style={{ marginTop: ACT_GAP - RHYTHM, marginBottom: ACT_GAP - RHYTHM }}
        >
          <MediaActBar
            chip={mediaChip}
            onChipChange={changeChip}
            query={mediaQuery}
            onQueryChange={setMediaQuery}
          />

        </div>

        {/* MEDIA-CONTROLLED SUBTREE. This starts after the chips and search; the
            honours board is a preceding sibling and cannot be reached by this
            state boundary. display:contents preserves the established rhythm. */}
        <div data-media-filter-scope={mediaChip} style={{ display: 'contents' }}>

        {/* 7 — PHOTOS lead the media (§1.2 reasoning above). On 'Everything' this
            is a 12-tile sample whose see-all SWITCHES THE CHIP instead of
            navigating; on 'Photos' the mosaic runs the whole pool with its own
            infinite reveal. NO SUBLINE (§5): "From the courses" told a member
            nothing the tiles did not. */}
        {(mediaChip === 'all' || mediaChip === 'photos') && photosShown.length > 0 && (
          <section>
            <Eyebrow
              aside={
                mediaChip === 'all' && photoPool.length > photosShown.length ? (
                  <InkAction onClick={() => changeChip('photos')}>
                    {t('discover.seeAll', 'See all')}
                  </InkAction>
                ) : undefined
              }
            >
              {t('community.sections.photos.title', 'Photos')}
            </Eyebrow>
            {/* 2px to reach the 16px mosaic margin from the page's 14px. */}
            <div style={{ margin: `${HEAD_GAP}px 2px 0` }}>
              <CommunityPhotoMosaic
                items={photosShown}
                onPress={handlePhoto}
                infinite={mediaChip === 'photos'}
                tone="dark"
                surface="discover"
              />
            </div>
          </section>
        )}

        {/* 8 — CLIPS. On 'Everything' the RAIL (capped, horizontal, sublined
            "under three minutes"); on 'Clips' the MOSAIC, which is the treatment
            /community used for the same pool and the only one that can carry 71
            clips. The rail's see-all switches the chip. */}
        {mediaChip === 'all' && (
          <ClipsRail
            items={communityVideos.data?.clips ?? []}
            onTilePress={handleClip}
            onSeeAll={() => changeChip('clips')}
          />
        )}
        {mediaChip === 'clips' && clipPool.length > 0 && (
          <section>
            <Eyebrow>{t('community.sections.clips.title', 'Clips')}</Eyebrow>
            <div style={{ margin: `${HEAD_GAP}px 2px 0` }}>
              <ProgressiveReveal items={clipPool} step={CLIP_STEP}>
                {(visible) => (
                  <CommunityClipMosaic items={visible} onPress={handleClip} surface="discover" />
                )}
              </ProgressiveReveal>
            </div>
          </section>
        )}

        {/* 9 — LATEST VIDEOS. Same shape: rail on 'Everything', the /community
            ROW LIST on 'Videos', where titles matter more than thumbnails.
            The FEATURED FILM does not come across: Discover already has a hero,
            and a second full-width one in act two competes with it. */}
        {mediaChip === 'all' && (
          <LatestVideosRail
            items={communityVideos.data?.videos ?? []}
            onTilePress={handleVideo}
            onSeeAll={() => changeChip('videos')}
          />
        )}
        {mediaChip === 'videos' && videoPool.length > 0 && (
          <section>
            <Eyebrow>{t('community.sections.videos.title', 'Latest videos')}</Eyebrow>
            <div style={{ marginTop: HEAD_GAP }}>
              {videoPool.map((item, i) => (
                <CommunityVideoRow
                  key={item.key}
                  item={item}
                  first={i === 0}
                  tone="dark"
                  onPress={handleVideo}
                  track={mediaTarget(item, 'discover', 'videos', i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 10 — BROWSE BY CLUB IS LAST (§1.3): a way IN, not something to read,
            and it covers only tagged content. It survives on 'Everything' and on
            'Photos' — the two views where a member is browsing rather than
            watching. NO SUBLINE (§5); the tagging caveat is a builder's note. */}
        {(mediaChip === 'all' || mediaChip === 'photos') && (
          <CommunityCourseIndex
            items={libraryAll}
            title={t('community.sections.clubs.title', 'Browse by club')}
            countLabel={(n) => t('community.count', { count: n, defaultValue: '{{count}} posts' })}
            tone="dark"
            embedded
          />
        )}
        </div>


        {/* From the community was removed from Discover deliberately. Discover
            now shows no member photographs; the Community page still holds
            them, but every route to it from here is labelled video. */}

        {/* Clears the floating bottom nav. Collapses to 16px on routes where
            the nav hides, because the nav publishes --bottom-nav-height: 0px. */}
        <div
          aria-hidden="true"
          style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }}
        />
      </div>

      <GolfThisWeekSheet
        open={golfWeekSheet}
        onClose={() => setGolfWeekSheet(false)}
        userId={userId}
        scope={weekScope}
        onScopeChange={handleScopeChange}
        region={weekRegion}
        onRowPress={(scoreId, uid) => {
          if (scoreId) opener.openByScore(scoreId, null, uid);
          else opener.openProfile(uid);
        }}
      />

      <FindGolfersSheet open={findGolfers} onClose={() => setFindGolfers(false)} />

      <MostPlayedSheet
        open={mostPlayedSheet}
        onClose={() => setMostPlayedSheet(false)}
        rows={mostPlayedList}
        onRowPress={handleMostPlayed}
        onPlayerPress={handleMostPlayedPlayer}
      />

      <HonoursBoardSheet
        open={honoursSheet}
        onClose={() => setHonoursSheet(false)}
        events={honours}
        onRowPress={handleHonoursRow}
        initialMode={honoursMode}
        focusUserId={honoursFocus}
      />




      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
}
