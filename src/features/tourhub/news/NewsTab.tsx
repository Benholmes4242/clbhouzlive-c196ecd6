/**
 * NewsTab — THE WIRE. The Tour Hub's editorial surface.
 *
 * The newest story is PHOTO-LED (176px band); every other story is a row with a
 * 62px thumbnail right. A story with no image falls back to the row treatment
 * even in the lead slot, so the list simply carries no photo-led item that day.
 *
 * The tour lens comes from the island's picker via useTourLensFromPicker, and
 * the applied slug is published back up so the island label is a readout of
 * THIS list (BRIEF_TOUR_LABEL_FOLLOWS_THE_LIST).
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { readStoredTour } from '../hooks/useTourSelection';
import { useTourStories, type TourStory } from './useTourStories';
import { StoryImageHeadline, StoryImageKicker, StoryRelativeTime } from './StoryImageText';
import { OVERVIEW_HERO_HEIGHT } from '../components/overview-v3/OverviewHero';
import { heroCanonScrimOn } from '../_shared/heroGradient';
import { StoryRowEngagement } from '@/features/stories/StoryRowEngagement';
import { StoryLeaderboardStrip } from './StoryLeaderboardStrip';
import { useStoryEngagement, type StoryEngagement } from '@/features/stories/useStoryEngagement';
import {
  FeatureStory,
  GUTTER,
  HeroStory,
  KICKER,
  LoadMoreRow,
  StoryChipRail,
  WireItem,
  WorkhorseRow,
} from './StoryShapes';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';

import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SLATE_100,
} from '../_shared/tokens';

/** Slugs the news list can express. 'major' has no tour_slug counterpart. */
const NEWS_SLUGS = ['all', 'pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'];

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
      {kicker && at && <span aria-hidden style={{ flexShrink: 0 }}>{'\u00b7'}</span>}
      <span style={{ flexShrink: 0 }}><StoryRelativeTime at={at} /></span>
      {trailing && <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>{trailing}</span>}
    </div>
  );
}

export function LeadStory({ story, onOpen, compact = false, immersiveHero = true, engagement }: { story: TourStory; onOpen: () => void; compact?: boolean; immersiveHero?: boolean; engagement?: StoryEngagement | null }) {
  const bandPadding = compact ? 6 : 8;
  const sidePadding = compact ? 17 : 14;
  const standfirstPad = compact ? 4 : 6;
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
      <div style={{ position: 'relative', height: compact ? COMPACT_LEAD_HEIGHT : immersiveHero ? OVERVIEW_HERO_HEIGHT : 232, width: '100%', overflow: 'hidden', background: SLATE_100 }}>
        <img
          src={story.image_url as string}
          alt={story.headline}
          loading="lazy"
          style={{
            width: '100%',
            height: `calc(100% + ${HERO_SUBJECT_DROP * 2}px)`,
            objectFit: 'cover',
            // objectPosition is the default; it is written out to stop future
            // edits trying to "tune" a focal point that has no vertical travel
            // on this nearly-square hero (landscape photos crop at the sides).
            objectPosition: '50% 50%',
            display: 'block',
          }}
        />
        <div
          aria-hidden
          style={{
             position: 'absolute', left: 0, right: 0, bottom: 0, height: 260,
             background: heroCanonScrimOn(SLATE_50),
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
        <div style={{ padding: `${standfirstPad}px 14px 0`, fontSize: 13, lineHeight: 1.45, color: INK_MUTE }}>
          {story.standfirst}
        </div>
      )}
    </button>
  );
}

export function StoryRow({ story, onOpen, compact = false, engagement }: { story: TourStory; onOpen: () => void; compact?: boolean; engagement?: StoryEngagement | null }) {
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
      {story.image_url && (
        <img
          src={story.image_url}
          alt=""
          loading="lazy"
          style={{ width: compact ? 54 : 62, height: compact ? 54 : 62, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: SLATE_100 }}
        />
      )}
    </button>
  );
}

/**
 * THE WIRE INDEX (BRIEF_WIRE_REDESIGN). Four shapes, each denser than the last:
 * hero, two-up, rows, Latest. The shapes are the SHARED ones in StoryShapes —
 * the amateur News tab renders the same components at the same sizes.
 *
 * The tour lens stays CLIENT-SIDE (see useTourStories) and re-derives every
 * section, including which tournaments have enough stories for the rail.
 */
const WIRE_PAGE_SIZE = 10;

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

  const [tournament, setTournament] = useState<string | null>(null);
  const [wireLimit, setWireLimit] = useState(WIRE_PAGE_SIZE);

  /**
   * BY TOURNAMENT, NOT BY TOUR — the tour is already the page's context. A null
   * tournament_id has nothing to group under and never becomes a chip, though
   * the story still appears in the page's other shapes. The chip's label is the
   * story's own kicker: tour_stories carries no tournament name and reading one
   * would mean a new query, which this brief forbids.
   */
  const tournaments = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    for (const s of lensStories) {
      if (!s.tournament_id) continue;
      const existing = groups.get(s.tournament_id);
      if (existing) existing.count += 1;
      else groups.set(s.tournament_id, { label: (s.kicker || 'Tournament').trim(), count: 1 });
    }
    return [...groups.entries()]
      .map(([key, v]) => ({ key, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [lensStories]);

  // TWO CHIPS IS NOT A NAVIGATION: below three tournaments there is no rail,
  // and any active selection is dropped with it.
  const railChips = tournaments.length >= 3 ? tournaments : [];
  const activeTournament = railChips.some((c) => c.key === tournament) ? tournament : null;

  const stories = useMemo(
    () => (activeTournament ? lensStories.filter((s) => s.tournament_id === activeTournament) : lensStories),
    [lensStories, activeTournament],
  );

  const lead = stories[0];
  const afterLead = stories.slice(1);
  const twoUp = afterLead.length >= 2 ? afterLead.slice(0, 2) : [];
  const afterTwoUp = afterLead.slice(twoUp.length);
  const rows = afterTwoUp.slice(0, 3);
  const wire = afterTwoUp.slice(3);
  const visibleWire = wire.slice(0, wireLimit);

  const open = (slug: string) => navigate(`/tour/news/${slug}`);

  /* ONE READ PER WINDOW, never per row: every visible id in a single RPC. */
  const { engagementFor } = useStoryEngagement(
    'tour_story',
    useMemo(() => lensStories.map((s) => s.id), [lensStories]),
  );

  return (
    <div style={{ fontFamily: FONT, paddingBottom: 24 }}>
      {isLoading ? (
        <div>
          <Skeleton style={{ height: 340, width: '100%', borderRadius: 0 }} />
          <div style={{ padding: '0 14px' }}>
            <Skeleton style={{ height: 62, width: '100%', marginTop: 16 }} />
            <Skeleton style={{ height: 62, width: '100%', marginTop: 12 }} />
          </div>
        </div>
      ) : !lead ? (
        <div style={{ padding: immersiveHero ? 'calc(env(safe-area-inset-top, 0px) + 76px) 14px 0' : '18px 14px 0', fontSize: 13, color: INK_MUTE }}>
          {t('news.empty', 'No stories on the wire yet.')}
        </div>
      ) : (
        <>
          <HeroStory
            story={lead}
            onOpen={() => open(lead.slug)}
            engagement={engagementFor(lead.id)}
            topOffset={immersiveHero ? 'calc(env(safe-area-inset-top, 0px) + 68px)' : 13}
          />
          {/* BRIEF_WIRE_INDEX_TICKER — bound to the LEAD's event. No lead or no
              tournament_id ⇒ not mounted, and no height reserved. */}
          {lead.tournament_id && <StoryLeaderboardStrip tournamentId={lead.tournament_id} />}

          <div style={{ padding: `0 ${GUTTER}px` }}>
            {twoUp.length === 2 && (
              <section aria-label="Featured stories" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 9, marginTop: 24 }}>
                {twoUp.map((s) => (
                  <FeatureStory key={s.id} story={s} onOpen={() => open(s.slug)} engagement={engagementFor(s.id)} />
                ))}
              </section>
            )}

            {rows.length > 0 && (
              <section aria-label="More stories" style={{ marginTop: 24 }}>
                {rows.map((s, index) => (
                  <div key={s.id} style={{ borderTop: index === 0 ? `1px solid ${HAIRLINE_INK_10}` : 'none', borderBottom: `1px solid ${HAIRLINE_INK_10}` }}>
                    <WorkhorseRow story={s} onOpen={() => open(s.slug)} engagement={engagementFor(s.id)} />
                  </div>
                ))}
              </section>
            )}

            {railChips.length >= 3 && (
              <StoryChipRail
                id="wire-tournaments"
                heading="By tournament"
                chips={railChips}
                selected={activeTournament}
                onSelect={(key) => {
                  setTournament(key);
                  setWireLimit(WIRE_PAGE_SIZE);
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
              />
            )}

            {wire.length > 0 && (
              <section aria-labelledby="wire-latest" style={{ marginTop: 26, borderRadius: r.md, overflow: 'hidden', background: A.PANEL, border: `1px solid ${A.BORDER}` }}>
                {/* "Latest", NOT "The wire": the page itself is The Wire. */}
                <h2 id="wire-latest" style={{ ...KICKER, margin: 0, padding: '13px 13px 9px', color: A.INK }}>Latest</h2>
                {visibleWire.map((s) => (
                  <WireItem key={s.id} story={s} onOpen={() => open(s.slug)} />
                ))}
                {visibleWire.length < wire.length && (
                  <LoadMoreRow onClick={() => setWireLimit((current) => current + WIRE_PAGE_SIZE)} />
                )}
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
