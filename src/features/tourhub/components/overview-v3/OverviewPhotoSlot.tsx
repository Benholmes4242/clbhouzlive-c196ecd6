import type { TourStory } from '../../news/useTourStories';
import { StoryBand } from '../../overview/sections/StoryBand';

/** Page-independent content contract: future item kinds can extend this union
 * here without changing page placement. No sponsored behavior is implemented.
 * StoryBand owns image failure and absence, so no empty flex item/gap remains. */
export type OverviewSlotContent = { kind: 'story'; story: TourStory };

export function OverviewPhotoSlot({ content }: { content: OverviewSlotContent | null }) {
  if (!content) return null;
  return <StoryBand story={content.story} slot />;
}