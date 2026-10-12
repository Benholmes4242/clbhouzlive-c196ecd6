import type { StoryBlock } from './blocks';

/** Reading pace used for every story's reading time. */
export const WORDS_PER_MINUTE = 200;

function words(text: string | null | undefined): number {
  const trimmed = (text ?? '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * READING TIME IS COUNTED, NOT STORED. Only text-bearing blocks (paragraph,
 * heading, quote) count; image, leaderboard, player, stat and round blocks
 * add nothing. Rounded up, never below one minute.
 */
export function readingMinutes(blocks: StoryBlock[] | null | undefined): number {
  let total = 0;
  for (const b of blocks ?? []) {
    if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') total += words(b.text);
  }
  return Math.max(1, Math.ceil(total / WORDS_PER_MINUTE));
}

export function readingTimeLabel(blocks: StoryBlock[] | null | undefined): string {
  return `${readingMinutes(blocks)} min read`;
}
