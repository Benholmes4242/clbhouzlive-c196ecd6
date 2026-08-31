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
import { useTourStories, type TourStory } from './useTourStories';
import { storyTime } from './storyTime';
import { OVERVIEW_HERO_HEIGHT } from '../components/overview-v3/OverviewHero';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_100,
} from '../_shared/tokens';

/** Slugs the news list can express. 'major' has no tour_slug counterpart. */
const NEWS_SLUGS = ['all', 'pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'];

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK_FAINT,
};

function KickerLine({ kicker, at }: { kicker: string | null; at: string | null }) {
  const time = storyTime(at);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {kicker && (
        <span style={{ ...KICKER, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {kicker}
        </span>
      )}
      {kicker && time && <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: INK_FAINT, flexShrink: 0 }} />}
      {time && <span style={{ ...KICKER, whiteSpace: 'nowrap' }}>{time}</span>}
    </div>
  );
}

export function LeadStory({ story, onOpen }: { story: TourStory; onOpen: () => void }) {
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
      <div style={{ position: 'relative', height: OVERVIEW_HERO_HEIGHT, width: '100%', overflow: 'hidden', background: SLATE_100 }}>
        <img
          src={story.image_url as string}
          alt={story.headline}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 42%, rgba(0,0,0,0.78) 100%)',
          }}
        />
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 68px)', left: 14, right: 14 }}>
          <KickerLine kicker={story.kicker} at={story.published_at} />
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.015em', color: '#FFFFFF' }}>
            {story.headline}
          </div>
        </div>
      </div>
      {story.standfirst && (
        <div style={{ padding: '10px 14px 0', fontSize: 13, lineHeight: 1.45, color: INK_MUTE }}>
          {story.standfirst}
        </div>
      )}
    </button>
  );
}

export function StoryRow({ story, onOpen }: { story: TourStory; onOpen: () => void }) {
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
        <div style={{ marginTop: 5, fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: INK }}>
          {story.headline}
        </div>
        {story.standfirst && (
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
          style={{ width: 62, height: 62, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: SLATE_100 }}
        />
      )}
    </button>
  );
}

export function NewsTab() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const [tourLens, setTourLens] = useState<string | null>(null);

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
