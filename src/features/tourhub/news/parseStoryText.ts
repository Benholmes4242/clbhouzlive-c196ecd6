/**
 * The Wire — the paste parser.
 *
 * BEN WRITES ELSEWHERE AND PASTES. That single fact decides this file: the
 * primary input is one textarea holding a finished story, and this turns it into
 * body_blocks. A block-by-block authoring UI would be a chore performed three
 * times a week for no gain.
 *
 * THE PARSER NEVER FAILS. There is no error return, because an author mid-paste
 * should not be arguing with a validator. A line it cannot classify becomes a
 * PARAGRAPH — the worst outcome of a typo'd marker is prose where an embed was
 * meant, which is visible in the preview and fixed in one keystroke.
 *
 * The syntax is markdown for what markdown covers, and a bracket line for the
 * two things markdown cannot express (a live board, a player card).
 *
 *   ## text                       heading
 *   plain line                    paragraph
 *   ![caption|credit](url)        image
 *   > text |— Attribution         quote
 *   [leaderboard]                 the STORY'S OWN tournament (primary form)
 *   [leaderboard:<uuid>]          a different tournament
 *   [player:Full Name]            resolved to a uuid at parse time
 *   [player:<uuid>]               still works
 *   [stat:Full Name]              season statistics card
 *   [round:Full Name]             that player's week at the STORY'S tournament

 *
 * MARKERS ARE WRITTEN BY NAME, NOT BY UUID. Ben writes elsewhere, in a tool
 * with no database, so requiring ids would mean hand-copying uuids three times
 * a week. Names resolve ONCE, here, and the stored block always holds the uuid
 * — a player who changes name later cannot break a published story.
 */
import type { StoryBlock } from './blocks';

/** `![caption|credit](url)` — caption and credit are both optional. */
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\s*\)$/;
const HEADING_RE = /^#{1,3}\s+(.*)$/;
const QUOTE_RE = /^>\s*(.*)$/;
/** The argument is OPTIONAL — `[leaderboard]` is the primary form. */
const EMBED_RE = /^\[(leaderboard|player|stat|round)(?::\s*([^\]]*))?\]$/i;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/**
 * Attribution separator. Accepts an em dash, an en dash or a hyphen after the
 * pipe, and the pipe alone — a paste from a word processor will have had its
 * dash silently changed and that must not cost the author the attribution.
 */
const ATTRIB_SPLIT = /\s*\|\s*[—–-]?\s*/;

/** The three marker kinds written by NAME and resolved to a uuid at parse time. */
export type PendingKind = 'player' | 'stat' | 'round';

export interface PendingPlayer {
  /** Index into `blocks` of the placeholder awaiting a uuid. */
  blockIndex: number;
  /** The name exactly as written, so problems can be reported verbatim. */
  name: string;
  /**
   * Which block shape is waiting. `stat` additionally requires a statistics
   * row and `round` a scorecard at the story's tournament, so the resolver has
   * to know which check to run.
   */
  kind: PendingKind;
  /** For `round` only: the story's tournament the appearance is checked against. */
  tournamentId?: string;
}

export interface ParseResult {
  blocks: StoryBlock[];
  /** Per-type tallies, so the editor can say what it produced without a diff. */
  counts: Record<StoryBlock['type'], number>;
  /**
   * Lines that carried a marker this parser could not resolve and so became
   * prose. Reported, never thrown: the author decides whether it was a typo.
   */
  reclassified: string[];
  /**
   * Markers that were understood but could not be turned into a block —
   * a board with no tournament, a player name that matched nothing or several.
   * The block is DROPPED, so an unresolvable embed can never be saved.
   */
  unresolved: string[];
  /** Player blocks still holding a placeholder id, awaiting name resolution. */
  pendingPlayers: PendingPlayer[];
}

/**
 * The block a pending marker occupies until the resolver fills in its uuid. It
 * is written with an EMPTY player_id on purpose: parseStoryBlocks drops a block
 * with no id, so an unresolved marker that somehow reaches storage renders
 * nothing rather than a broken card.
 */
function placeholder(kind: PendingKind, tournamentId: string): StoryBlock {
  if (kind === 'stat') return { type: 'stat', player_id: '' };
  if (kind === 'round') return { type: 'round', player_id: '', tournament_id: tournamentId };
  return { type: 'player', player_id: '' };
}

const emptyCounts = (): Record<StoryBlock['type'], number> => ({
  paragraph: 0, heading: 0, image: 0, quote: 0, leaderboard: 0, player: 0, stat: 0, round: 0,
});


/**
 * Anything bracket- or bang-shaped that MEANT to be a marker and missed. Kept
 * DELIBERATELY loose — `[leaderbord:…]` is the mistake that will actually be
 * made, and matching only the correct spellings would never catch it.
 */
function looksLikeAMarker(line: string): boolean {
  return /^!\[/.test(line) || /^\[[^\]]*:?[^\]]*\]$/.test(line);
}

export interface ParseContext {
  /** The story's own tournament, used by the bare `[leaderboard]` form. */
  tournamentId?: string | null;
}


export function parseStoryText(source: string, ctx: ParseContext = {}): ParseResult {
  const blocks: StoryBlock[] = [];
  const counts = emptyCounts();
  const reclassified: string[] = [];
  const unresolved: string[] = [];
  const pendingPlayers: PendingPlayer[] = [];
  const storyTournamentId = (ctx.tournamentId ?? '').trim();

  // Paragraph text accumulates across consecutive plain lines so a soft-wrapped
  // paste stays ONE paragraph; a blank line or any marker line closes it.
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join('\n').trim();
    buffer = [];
    if (!text) return;
    blocks.push({ type: 'paragraph', text });
    counts.paragraph += 1;
  };
  const push = (b: StoryBlock) => {
    flush();
    blocks.push(b);
    counts[b.type] += 1;
  };

  for (const raw of (source ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();

    if (!line) { flush(); continue; }

    const heading = HEADING_RE.exec(line);
    if (heading && heading[1].trim()) { push({ type: 'heading', text: heading[1].trim() }); continue; }

    const image = IMAGE_RE.exec(line);
    if (image) {
      const [caption, credit] = image[1].split('|').map((s) => s.trim());
      push({
        type: 'image',
        url: image[2].trim(),
        caption: caption || null,
        credit: credit || null,
      });
      continue;
    }

    const embed = EMBED_RE.exec(line);
    if (embed) {
      const kind = embed[1].toLowerCase() as 'leaderboard' | PendingKind;
      const arg = (embed[2] ?? '').trim();
      if (kind === 'leaderboard') {
        // Bare `[leaderboard]` means THIS story's tournament; an explicit uuid
        // overrides it for the rare cross-tournament embed.
        const id = arg || storyTournamentId;
        if (id) push({ type: 'leaderboard', tournament_id: id });
        else {
          flush();
          unresolved.push('leaderboard block has no tournament — pick one above');
        }
      } else if (kind === 'round' && !storyTournamentId) {
        // A tournament week with no tournament is not a block. Same rule as a
        // bare `[leaderboard]` with nothing selected.
        flush();
        unresolved.push(`round block "${arg || '?'}" has no tournament — pick one above`);
      } else if (!arg) {
        flush();
        unresolved.push(`${kind} block has no name`);
      } else if (UUID_RE.test(arg)) {
        // A uuid still needs its data checked (a statistics row, an appearance),
        // so it joins the pending list exactly as a name does.
        flush();
        pendingPlayers.push({
          blockIndex: blocks.length,
          name: arg,
          kind,
          tournamentId: kind === 'round' ? storyTournamentId : undefined,
        });
        blocks.push(placeholder(kind, storyTournamentId));
        counts[kind] += 1;
      } else {
        // A NAME. It gets a placeholder block whose id is filled in by the
        // resolver; if the name does not resolve, the block is dropped.
        flush();
        pendingPlayers.push({
          blockIndex: blocks.length,
          name: arg,
          kind,
          tournamentId: kind === 'round' ? storyTournamentId : undefined,
        });
        blocks.push(placeholder(kind, storyTournamentId));
        counts[kind] += 1;
      }
      continue;
    }


    const quote = QUOTE_RE.exec(line);
    if (quote && quote[1].trim()) {
      const [text, attribution] = quote[1].split(ATTRIB_SPLIT);
      push({
        type: 'quote',
        text: (text ?? '').trim(),
        attribution: (attribution ?? '').trim() || null,
      });
      continue;
    }

    // Unclassified. It becomes prose, and if it was SHAPED like a marker the
    // editor says so rather than the author finding out on the live page.
    if (looksLikeAMarker(line)) reclassified.push(line);
    buffer.push(line);
  }
  flush();

  return { blocks, counts, reclassified, unresolved, pendingPlayers };
}


/**
 * Blocks back to source text. The round trip exists so a story authored before
 * source_text was stored, or edited block-by-block afterwards, can still be
 * pulled back into the paste box.
 */
export function blocksToText(blocks: StoryBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading': return `## ${b.text}`;
        case 'paragraph': return b.text;
        case 'image': {
          const label = [b.caption ?? '', b.credit ?? ''].filter(Boolean).join('|');
          return `![${label}](${b.url})`;
        }
        case 'quote': return `> ${b.text}${b.attribution ? ` |\u2014 ${b.attribution}` : ''}`;
        case 'leaderboard': return `[leaderboard:${b.tournament_id}]`;
        case 'player': return `[player:${b.player_id}]`;
        case 'stat': return `[stat:${b.player_id}]`;
        case 'round': return `[round:${b.player_id}]`;

        default: return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Headline to slug. Editable afterwards; this is only the starting point. */
export function slugifyHeadline(headline: string): string {
  return (headline ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}
