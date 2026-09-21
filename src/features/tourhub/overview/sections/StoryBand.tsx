import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { TourStory } from '../../news/useTourStories';
import { storyTime } from '../../news/storyTime';
import { FONT, INK, STORY_BAND_META_INK, STORY_BAND_SCRIM } from '../../_shared/tokens';
import { fullTourLabel } from '../../_shared/tourOrder';

const DAY_MS = 86_400_000;
const MATCH_MAX_AGE_MS = 7 * DAY_MS;
const FALLBACK_MAX_AGE_MS = 7 * DAY_MS;

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

/**
 * The band IS the News hero, at the overview's 24px gutter. It renders
 * HeroStory rather than restating its shape: two copies of a news card is how
 * two surfaces drift (see StoryShapes.tsx). topOffset stays at its default —
 * the band sits mid-page, not under the immersive island.
 *
 * The wording is deliberately NOT the hero's: fullTourLabel keeps the line on
 * the tour ("DP WORLD TOUR") where tagFor would prefer the event name.
 */
export function StoryBand({ story }: { story: TourStory | null }) {
  const navigate = useNavigate();
  const [failedStoryId, setFailedStoryId] = useState<string | null>(null);
  if (!story?.image_url || failedStoryId === story.id) return null;

  const tourKicker = story.tour_slug ? fullTourLabel(story.tour_slug) : story.kicker;
  return (
    <div data-overview-story-band={story.id} style={{ marginTop: 26, fontFamily: FONT, color: INK }}>
      <HeroStory
        story={story}
        onOpen={() => navigate(`/tour/news/${story.slug}`)}
        gutter={24}
        showEngagement={false}
        kicker={tourKicker ? tourKicker.toUpperCase() : undefined}
        onImageError={() => setFailedStoryId(story.id)}
      />
    </div>
  );
}
