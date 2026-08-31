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
import { useStoryEngagement, type StoryEngagement } from '@/features/stories/useStoryEngagement';
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
const COMPACT_LEAD_HEIGHT = 180;
/** Focal point for lead photos. LOWER number = subject sits LOWER in frame. */
const LEAD_FOCAL_Y = '18%';
/** Gradient height scales with the band so the visible wash keeps the same density. */
const COMPACT_LEAD_GRADIENT_HEIGHT = 312; // 260 * 1.2

function KickerLine({ kicker, at, compact = false }: { kicker: string | null; at: string | null; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {kicker && (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><StoryImageKicker color={INK} compact={compact}>{kicker}</StoryImageKicker></span>
      )}
      {kicker && at && <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: INK_FAINT, flexShrink: 0 }} />}
      <StoryRelativeTime at={at} />
    </div>
  );
}

export function LeadStory({ story, onOpen, compact = false, engagement }: { story: TourStory; onOpen: () => void; compact?: boolean; engagement?: StoryEngagement | null }) {
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
      <div style={{ position: 'relative', height: compact ? COMPACT_LEAD_HEIGHT : OVERVIEW_HERO_HEIGHT, width: '100%', overflow: 'hidden', background: SLATE_100 }}>
        <img
          src={story.image_url as string}
          alt={story.headline}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${LEAD_FOCAL_Y}`, display: 'block' }}
        />
        <div
          aria-hidden
          style={{
             position: 'absolute', left: 0, right: 0, bottom: 0, height: compact ? COMPACT_LEAD_GRADIENT_HEIGHT : 260,
             background: heroCanonScrimOn(SLATE_50),
          }}
        />
        <div style={{ position: 'absolute', top: compact ? 14 : 'calc(env(safe-area-inset-top, 0px) + 68px)', left: sidePadding, right: sidePadding }}>
          <KickerLine kicker={story.kicker} at={story.published_at} compact={compact} />
        </div>
        <div style={{ position: 'absolute', bottom: bandPadding, left: sidePadding, right: sidePadding }}>
          <StoryImageHeadline compact={compact}>{story.headline}</StoryImageHeadline>
          {/* Bottom-left of the photo band, beneath the headline, on glass:
              white-72 is what ReactionAction's own glass tone uses on
              photography (BRIEF_STORY_ENGAGEMENT §S4). Read-only. */}
          <div style={{ marginTop: 6 }}>
            <StoryRowEngagement engagement={engagement} tone="glass" />
          </div>
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
        <KickerLine kicker={story.kicker} at={story.published_at} />
        <div style={{ marginTop: 5, fontSize: compact ? 13.5 : 14.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: INK }}>
          {story.headline}
        </div>
        {!compact && story.standfirst && (
          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: INK_MUTE }}>
            {story.standfirst}
          </div>
        )}
        {/* THE META LINE, beneath the headline in the same faint ink as the
            time above it. It renders on the COMPACT variant too, where the
            standfirst is suppressed. */}
        <div style={{ marginTop: 6 }}>
          <StoryRowEngagement engagement={engagement} inkColor={INK_FAINT} />
        </div>
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

export function NewsTab() {
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

  const { stories, isLoading } = useTourStories(tourLens);

  const [lead, rest] = useMemo(() => {
    if (stories.length === 0) return [null, [] as TourStory[]];
    const first = stories[0];
    // A story with no image cannot be photo-led — it drops to a row and the
    // list has no lead band that day.
    if (!first.image_url) return [null, stories];
    return [first, stories.slice(1)];
  }, [stories]);

  const open = (slug: string) => navigate(`/tour/news/${slug}`);

  return (
    <div style={{ fontFamily: FONT, paddingBottom: 24 }}>
      {isLoading ? (
        <div>
          <Skeleton style={{ height: OVERVIEW_HERO_HEIGHT, width: '100%', borderRadius: 0 }} />
          <div style={{ padding: '0 14px' }}>
            <Skeleton style={{ height: 62, width: '100%', marginTop: 16 }} />
            <Skeleton style={{ height: 62, width: '100%', marginTop: 12 }} />
          </div>
        </div>
      ) : stories.length === 0 ? (
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 76px) 14px 0', fontSize: 13, color: INK_MUTE }}>
          {t('news.empty', 'No stories on the wire yet.')}
        </div>
      ) : (
        <>
          {lead && <LeadStory story={lead} onOpen={() => open(lead.slug)} />}
          <div style={{ marginTop: lead ? 14 : 0 }}>
            {rest.map((s, i) => (
              <div
                key={s.id}
                style={{ borderTop: i === 0 && !lead ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}
              >
                <StoryRow story={s} onOpen={() => open(s.slug)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
