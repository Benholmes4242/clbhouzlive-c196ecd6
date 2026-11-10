/**
 * NewsTab — TOUR NEWS, REBUILT (BRIEF_TOUR_NEWS_PAGE, signed-off mock).
 *
 * The page no longer runs its hero under the top chrome: a "Tour News" head
 * with a search button, the shared new-since-last-visit line, a 440px lead
 * hero with everything at the bottom, a still event card (deriveHeroState,
 * never a marquee), Your players for members, Top stories, By-event chips
 * named from one sr_tournaments read, and a grouped archive with read
 * styling. Search covers EVERY published story server-side.
 *
 * REUSED, never forked: newsVisit.ts (a story seen on the overview is not
 * new here), overviewNewsRules.ts (details line, players-in-the-story) and
 * OverviewNewsStory.tsx for the pair/row shapes. StoryPage and the overview
 * News section are untouched; StoryLeaderboardStrip stays for StoryPage.
 *
 * The tour lens comes from the island's picker via useTourLensFromPicker, and
 * the applied slug is published back up so the island label is a readout of
 * THIS list (BRIEF_TOUR_LABEL_FOLLOWS_THE_LIST).
 *
 * LeadStory / StoryRow below are legacy exports kept for their existing
 * importers (amateur surfaces); the rebuilt page does not use them.
 */
import React, { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { readStoredTour } from '../hooks/useTourSelection';
import { ACTIVE_TOUR_SLUGS } from '../constants/tourMap';
import { useTourStories, type TourStory } from './useTourStories';
import { StoryImageHeadline, StoryImageKicker, StoryRelativeTime } from './StoryImageText';
import { OVERVIEW_HERO_HEIGHT } from '../components/overview-v3/OverviewHero';
import { HERO_CANON_WASH } from '../_shared/heroGradient';
import { StoryRowEngagement } from '@/features/stories/StoryRowEngagement';
import { useStoryEngagement, type StoryEngagement } from '@/features/stories/useStoryEngagement';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { useTourPlayerFollows } from '../leaderboard/useTourPlayerFollows';
import { isNewStory, markNewsOpened, useNewsVisit } from './newsVisit';
import { useOverviewNewsData } from '../overview/sections/useOverviewNewsData';
import { NewsDetails, OverviewNewsStory } from '../overview/sections/OverviewNewsStory';
import { NEWS_TOUR_LABELS, type NewsPresentation } from '../overview/sections/overviewNewsRules';
import { displayEventName } from '../overview/sections/ComingUp';
import { readingMinutes } from './readingTime';
import { NewsEventCard } from './NewsEventCard';
import { useNewsEventNames, useNewsSearch } from './newsPageData';
import {
  archiveDay,
  archiveGroups,
  archiveMonthShort,
  archiveWeekday,
  assignTopStories,
  eventChips,
  EVENT_CHIP_MIN,
  highlightSegments,
  NEWS_PAGE_SIZE,
  storyDay,
  yourPlayersStories,
} from './newsPageRules';

import {
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_100,
} from '../_shared/tokens';

/** Slugs the news list can express. 'major' has no tour_slug counterpart. */
const NEWS_SLUGS: string[] = ['all', ...ACTIVE_TOUR_SLUGS];

/** Compact lead band used by the Wire section on the Tour Overview. */
const COMPACT_LEAD_HEIGHT = 212;
/**
 * How far the photograph's subject moves DOWN inside the compact hero frame.
 * The image box is made taller than its container and the container clips the
 * bottom, matching the treatment on the full story page (StoryArticle).
 */
const HERO_SUBJECT_DROP = 26;

function KickerLine({ kicker, at, compact = false, trailing }: { kicker: string | null; at: string | null; compact?: boolean; trailing?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {kicker && (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}><StoryImageKicker color={INK} compact={compact}>{kicker}</StoryImageKicker></span>
      )}
      {/* A CHARACTER, not a sized div: it shares the text baseline and optical
          centre by construction, and inherits size and colour from the line. */}
      {kicker && at && <span aria-hidden style={{ flexShrink: 0 }}>{'·'}</span>}
      <span style={{ flexShrink: 0 }}><StoryRelativeTime at={at} /></span>
      {trailing && <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>{trailing}</span>}
    </div>
  );
}

/**
 * `bleed` (BRIEF_EXPLORE_NEWS_FULL_BLEED): the image runs edge to edge out of a
 * 14px-gutter page, radius 0, no card border. Only the OVERLAID type keeps an
 * inset (20 from the viewport edge); the standfirst returns to the page gutter.
 */
/**
 * ON-GUTTER LEAD (device-check E). `onGutter` is additive and OFF by default, so
 * every existing caller renders byte-identically. When it is on, the CALLER owns
 * the horizontal gutter and the overlay text sits flush to the photograph's own
 * edge, so kicker, headline and standfirst all land on the page's 20px gutter
 * instead of 20 + 17. The full-bleed frame is suppressed for the same reason:
 * one gutter, owned once.
 */
export function LeadStory({ story, onOpen, compact = false, immersiveHero = true, engagement, bleed = false, onGutter = false }: { story: TourStory; onOpen: () => void; compact?: boolean; immersiveHero?: boolean; engagement?: StoryEngagement | null; bleed?: boolean; onGutter?: boolean }) {
  const bandPadding = compact ? 6 : 8;
  const sidePadding = onGutter ? 0 : bleed ? 20 : compact ? 17 : 14;
  const standfirstPad = compact ? 4 : 6;
  const bleedFrame: React.CSSProperties = bleed && !onGutter
    ? { marginInline: -14, width: 'calc(100% + 28px)', borderRadius: 0, border: 'none' }
    : {};
  return (
    <button
      type="button"
      onClick={onOpen}
      className="active:scale-[0.995]"
      style={{
        display: 'block', width: '100%', textAlign: 'left', background: 'none',
        border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT,
      }}
    >
      <div style={{ position: 'relative', height: compact ? COMPACT_LEAD_HEIGHT : immersiveHero ? OVERVIEW_HERO_HEIGHT : 232, width: '100%', overflow: 'hidden', background: SLATE_100, ...bleedFrame }}>
        <img
          src={story.image_url as string}
          alt={story.headline}
          loading="lazy"
          style={{
            width: '100%',
            height: `calc(100% + ${HERO_SUBJECT_DROP * 2}px)`,
            objectFit: 'cover',
            objectPosition: '50% 50%',
            display: 'block',
          }}
        />
        <div
          aria-hidden
          style={{
              /* Capped at the frame height so the gradient always resolves to
                 the full canvas colour at the photo's bottom edge — otherwise a
                 frame shorter than 260px cuts the scrim mid-gradient and leaves
                 a visible seam. */
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 'min(260px, 100%)',
             background: HERO_CANON_WASH,
          }}
        />
        <div style={{ position: 'absolute', top: compact ? 14 : immersiveHero ? 'calc(env(safe-area-inset-top, 0px) + 68px)' : 12, left: sidePadding, right: sidePadding }}>
          <KickerLine
            kicker={story.kicker}
            at={story.published_at}
            compact={compact}
            trailing={<StoryRowEngagement engagement={engagement} tone="glass" />}
          />
        </div>
        <div style={{ position: 'absolute', bottom: bandPadding, left: sidePadding, right: sidePadding }}>
          <StoryImageHeadline compact={compact}>{story.headline}</StoryImageHeadline>
        </div>
      </div>
      {story.standfirst && (
        <div style={{ padding: `${standfirstPad}px ${bleed || onGutter ? 0 : 14}px 0`, fontSize: 13, lineHeight: 1.45, color: INK_MUTE }}>
          {story.standfirst}
        </div>
      )}
    </button>
  );
}



/**
 * STORY ROW THUMBNAIL — NO PLACEHOLDER FILL, NO EMPTY BOX (device-walk-3 A).
 *
 * The thumbnail used to carry `background: SLATE_100`, so a failed image left a
 * 54x54 grey rectangle floating in the row. Measured on the tour overview at
 * 430pt: two of them, same x, one per Wire row. That is the state-collapse class
 * in its smallest form — "failed", "loading" and "no image" all rendered as one
 * grey square, and the state a member meets most often is the broken one.
 *
 * So: no fill, and on error the element UNMOUNTS. The row reflows and the
 * headline takes the full width. No fallback graphic, no background colour.
 *
 * THE REAL PROBLEM IS UPSTREAM AND IS FILED, NOT FIXED HERE: these images are
 * hotlinked from third-party hosts (progolfweekly.com, assets.golfchannel.com),
 * which fail on referrer policy, host blocks and publisher moves, and report
 * nothing. Ingest or proxy at publish time — see the roadmap open list.
 */
export function StoryRow({ story, onOpen, compact = false, engagement }: { story: TourStory; onOpen: () => void; compact?: boolean; engagement?: StoryEngagement | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="active:opacity-80"
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', textAlign: 'left',
        background: 'none', border: 'none', padding: '14px 14px', cursor: 'pointer', fontFamily: FONT,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <KickerLine
          kicker={story.kicker}
          at={story.published_at}
          trailing={<StoryRowEngagement engagement={engagement} inkColor={INK_FAINT} />}
        />
        <div style={{ marginTop: 5, fontSize: compact ? 13.5 : 14.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: INK }}>
          {story.headline}
        </div>
        {!compact && story.standfirst && (
          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: INK_MUTE }}>
            {story.standfirst}
          </div>
        )}
      </div>
      {story.image_url && !imageFailed && (
        <img
          src={story.image_url}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          style={{ width: compact ? 54 : 62, height: compact ? 54 : 62, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
    </button>
  );
}

/** THE ARCHIVE ROW. Date block (day over weekday; day over MONTH in search
 * results), headline, then the tour label (or the story's kicker when it has
 * no tour) and the reading time — or "✓ Read" once opened. */
function ArchiveRow({ story, read, query, onOpen }: { story: TourStory; read: boolean; query?: string; onOpen: () => void }) {
  const { t } = useTranslation('tourhub');
  const date = storyDay(story.published_at);
  const label = NEWS_TOUR_LABELS[story.tour_slug ?? ''] || story.kicker?.trim() || '';
  const headline = query
    ? highlightSegments(story.headline, query).map((seg, i) => (seg.match ? <mark key={i}>{seg.text}</mark> : <Fragment key={i}>{seg.text}</Fragment>))
    : story.headline;
  return (
    <button type="button" className={`tour-news-ar${read ? ' read' : ''}`} onClick={onOpen} aria-label={`Read ${story.headline}`}>
      <div className="tour-news-ar-date">
        <b className="tabular-nums">{date ? archiveDay(date) : ''}</b>
        <small>{date ? (query ? archiveMonthShort(date) : archiveWeekday(date)) : ''}</small>
      </div>
      <div>
        <h4>{headline}</h4>
        <div className="tour-news-ar-meta">
          {label && <span>{label}</span>}
          {label && <span className="sep" aria-hidden>·</span>}
          {read ? <span>{t('news.page.read', '✓ Read')}</span> : <span>{t('news.minRead', { n: readingMinutes(story.body_blocks) })}</span>}
        </div>
      </div>
    </button>
  );
}

/**
 * THE REBUILT PAGE. Page size and paging of the archive are as today (ten a
 * page, in place). Like and comment buttons are gone from this page — counts
 * live in the details line; the story page keeps the actions.
 */
export function NewsTab({ immersiveHero = true }: { immersiveHero?: boolean }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const [tourLens, setTourLens] = useState<string | null>(() => {
    const stored = readStoredTour();
    return stored && NEWS_SLUGS.includes(stored) && stored !== 'all' ? stored : null;
  });

  useTourLensFromPicker<string | null>(
    (slug) => (NEWS_SLUGS.includes(slug) ? (slug === 'all' ? null : slug) : undefined),
    (value) => setTourLens(value),
    tourLens ?? 'all',
  );

  const { stories: lensStories, isLoading } = useTourStories(tourLens);
  const { user } = useSupabaseSession();
  const guest = useIsGuest();
  const viewerId = !guest ? user?.id : undefined;

  const { ref: visitRef, visit } = useNewsVisit(!isLoading && lensStories.length > 0);
  const { engagementFor } = useStoryEngagement(
    'tour_story',
    useMemo(() => lensStories.map((s) => s.id), [lensStories]),
  );
  const { ids: follows } = useTourPlayerFollows(lensStories.length > 0 && !!viewerId);
  const presentations = useOverviewNewsData(lensStories);

  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [archiveLimit, setArchiveLimit] = useState(NEWS_PAGE_SIZE);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const search = useNewsSearch(query, tourLens);

  const presentationFor = (story: TourStory): NewsPresentation => {
    const base = presentations.get(story.id);
    const engagement = engagementFor(story.id);
    return {
      isNew: isNewStory(story, visit),
      liveRound: base?.liveRound ?? null,
      players: base?.players ?? [],
      followedPlayer: base?.followedPlayer,
      engagement: { likes: engagement.likeCount, comments: engagement.commentCount },
    };
  };

  const open = (story: TourStory) => {
    markNewsOpened(story.id);
    navigate(`/tour/news/${story.slug}`);
  };

  const lead = lensStories[0];
  const newCount = lensStories.filter((s) => isNewStory(s, visit)).length;
  const yourPlayers = viewerId ? yourPlayersStories(lensStories, follows, lead?.id) : [];
  const shownAbove = new Set<string>([lead?.id, ...yourPlayers.map((s) => s.id)].filter((id): id is string => !!id));
  const { pair, rows } = assignTopStories(lensStories, shownAbove);
  const topIds = new Set([...pair, ...rows].map((s) => s.id));
  const archivePool = lensStories.filter((s) => !shownAbove.has(s.id) && !topIds.has(s.id));

  const chips = eventChips(archivePool);
  const railChips = chips.length >= EVENT_CHIP_MIN ? chips : [];
  /* The chip names come from ONE sr_tournaments read, and only when the rail
   * exists. Until the names resolve there is no rail — never a kicker label. */
  const { data: eventNames } = useNewsEventNames(railChips.map((c) => c.id));
  const activeEvent = railChips.some((c) => c.id === eventFilter) ? eventFilter : null;
  const archiveStories = activeEvent ? archivePool.filter((s) => s.tournament_id === activeEvent) : archivePool;
  const visibleArchive = archiveStories.slice(0, archiveLimit);
  const groups = archiveGroups(visibleArchive);

  if (isLoading) {
    return (
      <div style={{ fontFamily: FONT }}>
        <Skeleton style={{ height: 340, width: '100%', borderRadius: 0 }} />
        <div style={{ padding: '0 14px' }}>
          <Skeleton style={{ height: 62, width: '100%', marginTop: 16 }} />
          <Skeleton style={{ height: 62, width: '100%', marginTop: 12 }} />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: immersiveHero ? 'calc(env(safe-area-inset-top, 0px) + 76px) 14px 0' : '18px 14px 0', fontSize: 13, color: INK_MUTE, fontFamily: FONT }}>
        {t('news.empty', 'No stories on the wire yet.')}
      </div>
    );
  }

  return (
    <div ref={visitRef as React.MutableRefObject<HTMLDivElement | null>} className="tour-news" style={{ fontFamily: FONT }}>
      {searchOpen ? (
        <div className="tour-news-searchbar" data-testid="tour-news-searchbar">
          <Search size={16} aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('news.page.searchPlaceholder', 'Search stories')}
            aria-label={t('news.page.searchPlaceholder', 'Search stories')}
          />
          <button type="button" className="tour-news-cancel" onClick={() => { setSearchOpen(false); setQuery(''); }}>
            Cancel
          </button>
        </div>
      ) : (
        <header className="tour-news-head">
          <h1>Tour News</h1>
          <button type="button" className="tour-news-search-btn" aria-label="Search stories" onClick={() => setSearchOpen(true)}>
            <Search size={17} aria-hidden />
          </button>
        </header>
      )}

      {searchOpen ? (
        <div>
          {search.active && search.settled && (
            search.results.length > 0 ? (
              <>
                <div className="tour-news-grp">{t('news.page.searchResults', { count: search.results.length })}</div>
                {search.results.map((s) => (
                  <ArchiveRow key={s.id} story={s} read={visit.openedIds.includes(s.id)} query={search.debounced} onOpen={() => open(s)} />
                ))}
              </>
            ) : (
              <div className="tour-news-search-empty">{t('news.page.searchEmpty', { query: search.debounced })}</div>
            )
          )}
        </div>
      ) : (
        <>
          {newCount > 0 && (
            <div className="tour-news-fresh">
              <i className="overview-news-dot" aria-hidden />
              <span><Trans t={t} i18nKey="overview.news.newSince" count={newCount} components={{ b: <b /> }} /></span>
            </div>
          )}

          <button type="button" className="tour-news-lead" onClick={() => open(lead)} aria-label={`Read ${lead.headline}`} data-testid="tour-news-lead">
            {lead.image_url && <img src={lead.image_url} alt="" loading="eager" decoding="async" />}
            <div className="tour-news-lead-copy">
              <div className="overview-news-kicker">
                {presentationFor(lead).isNew && <i className="overview-news-dot" aria-hidden />}
                <span>{lead.kicker}</span>
              </div>
              <h2>{lead.headline}</h2>
              {lead.standfirst && <p className="tour-news-standfirst">{lead.standfirst}</p>}
              <NewsDetails story={lead} presentation={presentationFor(lead)} short={false} />
            </div>
          </button>

          {lead.tournament_id && <NewsEventCard tournamentId={lead.tournament_id} follows={follows} />}

          {viewerId && yourPlayers.length > 0 && (
            <>
              <div className="tour-news-sec you" data-testid="tour-news-your-players">
                <span>YOUR PLAYERS</span>
                <span className="count">{t('news.page.yourPlayersCount', { count: yourPlayers.length })}</span>
              </div>
              <div className="tour-news-rows">
                {yourPlayers.map((s) => (
                  <OverviewNewsStory key={s.id} story={s} onOpen={() => open(s)} presentation={presentationFor(s)} shape="row" />
                ))}
              </div>
            </>
          )}

          {(pair.length > 0 || rows.length > 0) && (
            <>
              <div className="tour-news-sec"><span>TOP STORIES</span><span /></div>
              {pair.length === 2 && (
                <div className="tour-news-pair">
                  {pair.map((s) => (
                    <OverviewNewsStory key={s.id} story={s} onOpen={() => open(s)} presentation={presentationFor(s)} shape="pair" />
                  ))}
                </div>
              )}
              {rows.length > 0 && (
                <div className="tour-news-rows">
                  {rows.map((s) => (
                    <OverviewNewsStory key={s.id} story={s} onOpen={() => open(s)} presentation={presentationFor(s)} shape="row" />
                  ))}
                </div>
              )}
            </>
          )}

          {railChips.length >= EVENT_CHIP_MIN && eventNames && (
            <>
              <div className="tour-news-sec"><span>BY EVENT</span><span /></div>
              <div className="tour-news-events" role="group" aria-label="By event">
                <button
                  type="button"
                  className={`tour-news-chip${activeEvent === null ? ' on' : ''}`}
                  onClick={() => { setEventFilter(null); setArchiveLimit(NEWS_PAGE_SIZE); }}
                >
                  All
                </button>
                {railChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={`tour-news-chip${activeEvent === chip.id ? ' on' : ''}`}
                    onClick={() => { setEventFilter(chip.id); setArchiveLimit(NEWS_PAGE_SIZE); }}
                  >
                    {displayEventName(eventNames.get(chip.id) ?? '')} <small className="tabular-nums">{chip.count}</small>
                  </button>
                ))}
              </div>
            </>
          )}

          {groups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <div className="tour-news-grp">{group.label}</div>
              {group.stories.map((s) => (
                <ArchiveRow key={s.id} story={s} read={visit.openedIds.includes(s.id)} onOpen={() => open(s)} />
              ))}
            </section>
          ))}

          {visibleArchive.length < archiveStories.length && (
            <button type="button" className="tour-news-more" onClick={() => setArchiveLimit((current) => current + NEWS_PAGE_SIZE)}>
              {t('news.page.showOlder', 'Show older stories')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
