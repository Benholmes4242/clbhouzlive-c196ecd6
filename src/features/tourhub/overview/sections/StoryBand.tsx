import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { TourStory } from '../../news/useTourStories';
import { storyTime } from '../../news/storyTime';
import { FONT, INK, STORY_BAND_META_INK, STORY_BAND_SCRIM } from '../../_shared/tokens';
import { fullTourLabel } from '../../_shared/tourOrder';

const DAY_MS = 86_400_000;
const MATCH_MAX_AGE_MS = 7 * DAY_MS;
const FALLBACK_MAX_AGE_MS = 48 * 3_600_000;

function isFresh(story: TourStory, maxAge: number, now: Date): boolean {
  if (!story.image_url || !story.published_at) return false;
  const published = new Date(story.published_at).getTime();
  const age = now.getTime() - published;
  return Number.isFinite(published) && age >= 0 && age <= maxAge;
}

/** The input is already newest-first from useTourStories. */
export function selectOverviewBandStory(
  stories: TourStory[],
  tournamentId: string | null,
  now = new Date(),
): TourStory | null {
  if (tournamentId) {
    const matched = stories.find(
      (story) => story.tournament_id === tournamentId && isFresh(story, MATCH_MAX_AGE_MS, now),
    );
    if (matched) return matched;
  }
  return stories.find((story) => isFresh(story, FALLBACK_MAX_AGE_MS, now)) ?? null;
}

export function StoryBand({ story }: { story: TourStory | null }) {
  const navigate = useNavigate();
  const [failedStoryId, setFailedStoryId] = useState<string | null>(null);
  if (!story?.image_url || failedStoryId === story.id) return null;

  const tourKicker = story.tour_slug ? fullTourLabel(story.tour_slug) : story.kicker;
  const meta = [tourKicker, storyTime(story.published_at)].filter(Boolean).join(' · ').toUpperCase();
  return (
    <button
      type="button"
      data-overview-story-band={story.id}
      onClick={() => navigate(`/tour/news/${story.slug}`)}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: 230,
        marginTop: 26,
        padding: 0,
        border: 0,
        overflow: 'hidden',
        background: 'transparent',
        color: INK,
        fontFamily: FONT,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <img
        src={story.image_url}
        alt=""
        loading="lazy"
        onError={() => setFailedStoryId(story.id)}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <span aria-hidden style={{ position: 'absolute', inset: 0, background: STORY_BAND_SCRIM }} />
      <span style={{ position: 'absolute', left: 24, right: 24, bottom: 18 }}>
        {meta ? (
          <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: STORY_BAND_META_INK }}>
            {meta}
          </span>
        ) : null}
        <span
          style={{
            display: '-webkit-box',
            marginTop: 5,
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            fontSize: 21,
            lineHeight: 1.2,
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}
        >
          {story.headline}
        </span>
      </span>
    </button>
  );
}
