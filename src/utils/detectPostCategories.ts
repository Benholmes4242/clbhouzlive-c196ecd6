import { MOMENT_CATEGORIES } from '@/components/post/create-moment/categoryDefinitions';

/**
 * Auto-detects categories from a post caption using keyword matching.
 * Mirrors the SQL backfill logic. Returns an array of matched category IDs.
 * A post can match multiple categories.
 */
export function detectPostCategories(caption: string | null | undefined): string[] {
  if (!caption || caption.trim().length === 0) return [];

  const lower = caption.toLowerCase();
  const matched: string[] = [];

  for (const category of MOMENT_CATEGORIES) {
    if (!category.discoverEnabled) continue;
    if (!category.keywords || category.keywords.length === 0) continue;

    const matches = category.keywords.some(keyword =>
      lower.includes(keyword.toLowerCase())
    );

    if (matches) {
      matched.push(category.id);
    }
  }

  // Additional patterns not in categoryDefinitions keywords —
  // golf-meme language for the 'funny' category
  const funnyExtras = [
    'when you', 'when your', 'every golfer', 'be like',
    'imagine being', 'pov:', '😂', '🤣',
  ];
  if (!matched.includes('funny') && funnyExtras.some(p => lower.includes(p))) {
    matched.push('funny');
  }

  // hole-out: chip-ins and long putts (distinct from hole-in-one)
  const holeOutPatterns = [
    'hole out', 'holed', 'chips in', 'chipped in',
    'holing', '50 yard', '40 yard', '30 yard',
  ];
  if (
    !matched.includes('hole-out') &&
    !matched.includes('hole-in-one') &&
    holeOutPatterns.some(p => lower.includes(p))
  ) {
    matched.push('hole-out');
  }

  return matched;
}
