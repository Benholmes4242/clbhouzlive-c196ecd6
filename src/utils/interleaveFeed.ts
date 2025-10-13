import { ExploreContentItem } from '@/components/explore/types';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';

export type FeedItem =
  | { kind: 'video'; id: string; data: ExploreContentItem }
  | { kind: 'channel_suggestion'; id: string; data: ChannelSuggestion };

const SUGGEST_EVERY = 6;

/**
 * Interleaves channel suggestions into a video feed at regular intervals
 * @param videos - Array of video items to display
 * @param getSuggestion - Function to get the next channel suggestion
 * @param startIndexOffset - Global index offset to maintain cadence across pages
 * @returns Array of feed items (videos + channel suggestions)
 */
export function buildInterleavedFeed(
  videos: ExploreContentItem[],
  getSuggestion: (avoid: Set<string>) => ChannelSuggestion | null,
  startIndexOffset: number = 0
): FeedItem[] {
  const result: FeedItem[] = [];
  const seenChannelIds = new Set<string>();
  let globalVideoIndex = startIndexOffset;

  for (const video of videos) {
    result.push({ kind: 'video', id: video.id, data: video });
    globalVideoIndex++;

    // Insert channel suggestion after every SUGGEST_EVERY videos
    const shouldInsert = globalVideoIndex % SUGGEST_EVERY === 0;
    if (shouldInsert) {
      const suggestion = getSuggestion(seenChannelIds);
      if (suggestion) {
        result.push({
          kind: 'channel_suggestion',
          id: `sugg_${suggestion.id}_${globalVideoIndex}`,
          data: suggestion,
        });
        seenChannelIds.add(suggestion.id);
      }
    }
  }

  return result;
}
