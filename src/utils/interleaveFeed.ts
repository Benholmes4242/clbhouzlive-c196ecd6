import { ExploreContentItem } from '@/components/explore/types';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';

export interface InterleavedItem {
  kind: 'video' | 'channel_suggestion';
  id: string;
  data: ExploreContentItem | ChannelSuggestion;
}

const SUGGEST_EVERY = 6;

/**
 * Interleaves channel suggestions into a video feed.
 * Inserts a suggestion after every 6th video.
 * 
 * @param videos - Array of video content items
 * @param getNextSuggestion - Function to get the next channel suggestion
 * @param startIndexOffset - Global video index offset for pagination
 */
export function buildInterleavedFeed(
  videos: ExploreContentItem[],
  getNextSuggestion: () => ChannelSuggestion | null,
  startIndexOffset: number = 0
): InterleavedItem[] {
  const result: InterleavedItem[] = [];
  let globalVideoIndex = startIndexOffset;

  videos.forEach((video, localIndex) => {
    // Add the video
    result.push({
      kind: 'video',
      id: video.id,
      data: video
    });

    globalVideoIndex++;

    // After every 6th video (at positions 6, 12, 18, ...), insert a suggestion
    if (globalVideoIndex % SUGGEST_EVERY === 0) {
      const suggestion = getNextSuggestion();
      if (suggestion) {
        result.push({
          kind: 'channel_suggestion',
          id: `sugg_${suggestion.id}_${globalVideoIndex}`,
          data: suggestion
        });
      }
    }
  });

  return result;
}
