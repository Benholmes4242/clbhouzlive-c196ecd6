import type { FeedPost } from '@/components/media-system/types/media';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

/** One news slide every SIXTH post; each beat therefore every twelfth. */
export const WIRE_SLIDE_CADENCE = 6;
export const WIRE_STORY_MAX_AGE_DAYS = 14;

export type StoryBeat = 'tour' | 'amateur';

export type ClubhouseFeedItem =
  | { kind: 'post'; key: string; post: FeedPost; postIndex: number }
  | { kind: 'wire'; key: string; story: TourStory; beat: StoryBeat; more: TourStory[] };

/** A wire slide shows its lead plus up to this many more from the SAME beat. */
export const WIRE_BRIEFING_EXTRA = 2;

function eligible(stories: TourStory[], nowMs: number): TourStory[] {
  const oldestAllowedMs = nowMs - WIRE_STORY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  return stories
    .filter((story) => {
      if (!story?.id || seen.has(story.id) || !story.image_url || !story.published_at) return false;
      const publishedMs = new Date(story.published_at).getTime();
      if (!Number.isFinite(publishedMs) || publishedMs > nowMs || publishedMs < oldestAllowedMs) return false;
      seen.add(story.id);
      return true;
    })
    .sort((a, b) => new Date(b.published_at as string).getTime() - new Date(a.published_at as string).getTime());
}

export function injectWireStories(
  posts: FeedPost[],
  tourStories: TourStory[],
  amateurStories: TourStory[] = [],
  nowMs = Date.now(),
): ClubhouseFeedItem[] {
  const postItems: Array<Extract<ClubhouseFeedItem, { kind: 'post' }>> = posts.map((post, postIndex) => ({
    kind: 'post',
    key: `post:${post.id}`,
    post,
    postIndex,
  }));

  if (posts.length < WIRE_SLIDE_CADENCE) return postItems;

  const queues: Record<StoryBeat, TourStory[]> = {
    tour: eligible(tourStories, nowMs),
    amateur: eligible(amateurStories, nowMs),
  };
  const cursors: Record<StoryBeat, number> = { tour: 0, amateur: 0 };

  // Each beat keeps its OWN cursor; an exhausted beat falls back to the other
  // rather than leaving a gap the reader cannot explain.
  // A slide takes its lead AND the next two of that beat, advancing the
  // cursor by three, so the next slide of the beat repeats none of them. The
  // briefing never pads across beats.
  const take = (preferred: StoryBeat): { story: TourStory; beat: StoryBeat; more: TourStory[] } | null => {
    const order: StoryBeat[] = preferred === 'tour' ? ['tour', 'amateur'] : ['amateur', 'tour'];
    for (const beat of order) {
      const start = cursors[beat];
      const story = queues[beat][start];
      if (story) {
        const more = queues[beat].slice(start + 1, start + 1 + WIRE_BRIEFING_EXTRA);
        cursors[beat] = start + 1 + more.length;
        return { story, beat, more };
      }
    }
    return null;
  };

  if (queues.tour.length === 0 && queues.amateur.length === 0) return postItems;

  const merged: ClubhouseFeedItem[] = [];
  let slot = 0;
  for (const item of postItems) {
    merged.push(item);
    if ((item.postIndex + 1) % WIRE_SLIDE_CADENCE !== 0) continue;
    // Slot 1 = tour, slot 2 = amateur, alternating.
    const preferred: StoryBeat = slot % 2 === 0 ? 'tour' : 'amateur';
    const picked = take(preferred);
    if (!picked) continue;
    merged.push({
      kind: 'wire',
      key: `wire:${picked.beat}:${picked.story.id}`,
      story: picked.story,
      beat: picked.beat,
      more: picked.more,
    });
    slot += 1;
  }
  return merged;
}
