/**
 * The Wire — body block schema.
 *
 * A story body is an ORDERED ARRAY of typed blocks, not markdown: markdown
 * handles multiple images fine but cannot embed a LIVE LEADERBOARD mid-article,
 * which is the whole reason this shape exists.
 *
 * FORWARD COMPATIBILITY IS A RULE, NOT A NICETY. An unknown type renders
 * nothing and breaks nothing, so new block types can ship server-side before
 * every client understands them. Validation lives in the DB trigger
 * (validate_tour_story_blocks) — on WRITE, so a published story always renders.
 * This module only NARROWS what arrives; it never rejects a story.
 */

export type StoryBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'image'; url: string; caption?: string | null; credit?: string | null }
  | { type: 'quote'; text: string; attribution?: string | null }
  | { type: 'leaderboard'; tournament_id: string }
  | { type: 'player'; player_id: string }
  /** Season statistics card. Only the id is stored; figures are read LIVE. */
  | { type: 'stat'; player_id: string }
  /** What a player did at ONE tournament. Both ids stored, figures read LIVE. */
  | { type: 'round'; player_id: string; tournament_id: string };


/**
 * Read a story's jsonb into blocks, dropping anything this client cannot
 * render. Unknown types are dropped SILENTLY on purpose (1.4).
 */
export function parseStoryBlocks(raw: unknown): StoryBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: StoryBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    const type = typeof b.type === 'string' ? b.type : '';
    const str = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : '');
    const opt = (k: string) => (typeof b[k] === 'string' && b[k] ? (b[k] as string) : null);

    switch (type) {
      case 'paragraph':
      case 'heading': {
        const text = str('text').trim();
        if (text) out.push({ type, text });
        break;
      }
      case 'image': {
        const url = str('url').trim();
        if (url) out.push({ type: 'image', url, caption: opt('caption'), credit: opt('credit') });
        break;
      }
      case 'quote': {
        const text = str('text').trim();
        if (text) out.push({ type: 'quote', text, attribution: opt('attribution') });
        break;
      }
      case 'leaderboard': {
        const id = str('tournament_id').trim();
        if (id) out.push({ type: 'leaderboard', tournament_id: id });
        break;
      }
      case 'player': {
        const id = str('player_id').trim();
        if (id) out.push({ type: 'player', player_id: id });
        break;
      }
      case 'stat': {
        const id = str('player_id').trim();
        if (id) out.push({ type: 'stat', player_id: id });
        break;
      }
      case 'round': {
        const pid = str('player_id').trim();
        const tid = str('tournament_id').trim();
        if (pid && tid) out.push({ type: 'round', player_id: pid, tournament_id: tid });
        break;
      }

      default:
        // Unknown type: render nothing, break nothing.
        break;
    }
  }
  return out;
}
