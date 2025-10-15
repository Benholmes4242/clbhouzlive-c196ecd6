import { ExploreContentItem } from '@/components/explore/types';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';

export interface InterleavedItem {
  kind: 'video' | 'channel_suggestion' | 'shorts_block';
  id: string;
  data: ExploreContentItem | ChannelSuggestion | ExploreContentItem[];
}

const SHORTS_EVERY = 5;        // After every 5 videos
const CHANNEL_EVERY = 8;       // After every 8 videos
const SHORTS_BLOCK_SIZE = 2;   // Two full-size shorts per block

/**
 * Interleaves shorts blocks and channel suggestions into a video feed.
 * - Inserts a shorts block (2 shorts) after every 5th video
 * - Inserts a channel suggestion after every 8th video
 * 
 * @param videos - Array of video content items
 * @param getNextShort - Function to get the next short item
 * @param getNextChannel - Function to get the next channel suggestion
 * @param startIndexOffset - Global video index offset for pagination (unused, kept for compatibility)
 * @param recentHistory - Set of recently shown IDs to avoid duplicates
 */
export function buildInterleavedFeed(
  videos: ExploreContentItem[],
  getNextShort: (avoidIds: Set<string>) => ExploreContentItem | null,
  getNextChannel: () => ChannelSuggestion | null,
  startIndexOffset: number = 0,
  recentHistory: Set<string> = new Set()
): InterleavedItem[] {
  const result: InterleavedItem[] = [];
  let globalVideoIndex = 0; // Always count from 0 for the entire array
  const localRecentIds = new Set([...recentHistory]);

  videos.forEach((video) => {
    // Add the video
    result.push({
      kind: 'video',
      id: video.id,
      data: video
    });

    localRecentIds.add(video.id);
    globalVideoIndex++;

    // After every 5th video, insert a shorts block (2 shorts)
    if (globalVideoIndex % SHORTS_EVERY === 0) {
      const shorts: ExploreContentItem[] = [];
      
      // Try to get 2 shorts
      for (let i = 0; i < SHORTS_BLOCK_SIZE; i++) {
        const short = getNextShort(localRecentIds);
        if (short) {
          shorts.push(short);
          localRecentIds.add(short.id);
        }
      }
      
      // Only add the block if we got both shorts
      if (shorts.length === SHORTS_BLOCK_SIZE) {
        result.push({
          kind: 'shorts_block',
          id: `shorts_block_${globalVideoIndex}_${Date.now()}`,
          data: shorts
        });
      } else if (shorts.length > 0 && import.meta.env.DEV) {
        console.warn('[Interleave] Could only get', shorts.length, 'shorts at position', globalVideoIndex);
      }
    }

    // After every 8th video, insert a channel suggestion
    if (globalVideoIndex % CHANNEL_EVERY === 0) {
      const channel = getNextChannel();
      if (channel) {
        result.push({
          kind: 'channel_suggestion',
          id: `sugg_${channel.id}_${globalVideoIndex}`,
          data: channel
        });
        localRecentIds.add(channel.id);
      }
    }
  });

  return result;
}
