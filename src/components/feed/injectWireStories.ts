import type { FeedPost } from '@/components/media-system/types/media';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

export const WIRE_SLIDE_CADENCE = 3;
export const WIRE_STORY_MAX_AGE_DAYS = 14;

export type ClubhouseFeedItem =
  | { kind: 'post'; key: string; post: FeedPost; postIndex: number }
  | { kind: 'wire'; key: string; story: TourStory };

export function injectWireStories(
  posts: FeedPost[],
  stories: TourStory[],
  nowMs = Date.now(),
): ClubhouseFeedItem[] {
  const postItems: Array<Extract<ClubhouseFeedItem, { kind: 'post' }>> = posts.map((post, postIndex) => ({
    kind: 'post',
    key: `post:${post.id}`,
    post,
    postIndex,
  }));

  if (posts.length < WIRE_SLIDE_CADENCE) return postItems;

  const oldestAllowedMs = nowMs - WIRE_STORY_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seenStoryIds = new Set<string>();
  const eligibleStories = stories
    .filter((story) => {
      if (seenStoryIds.has(story.id) || !story.image_url || !story.published_at) return false;
      const publishedMs = new Date(story.published_at).getTime();
      if (!Number.isFinite(publishedMs) || publishedMs > nowMs || publishedMs < oldestAllowedMs) return false;
      seenStoryIds.add(story.id);
      return true;
    })
    .sort((a, b) => new Date(b.published_at as string).getTime() - new Date(a.published_at as string).getTime());

  if (eligibleStories.length === 0) return postItems;

  const merged: ClubhouseFeedItem[] = [];
  let storyIndex = 0;
  for (const item of postItems) {
    merged.push(item);
    const completedGroup = (item.postIndex + 1) % WIRE_SLIDE_CADENCE === 0;
    const story = eligibleStories[storyIndex];
    if (completedGroup && story) {
      merged.push({ kind: 'wire', key: `wire:${story.id}`, story });
      storyIndex += 1;
    }
  }
  return merged;
}