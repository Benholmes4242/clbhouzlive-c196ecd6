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
 *   [leaderboard:<uuid>]          inline live board
 *   [player:<uuid>]               inline player card
 */
import type { StoryBlock } from './blocks';

/** `![caption|credit](url)` — caption and credit are both optional. */
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\s*\)$/;
const HEADING_RE = /^#{1,3}\s+(.*)$/;
const QUOTE_RE = /^>\s*(.*)$/;
const EMBED_RE = /^\[(leaderboard|player):\s*([^\]]+)\]$/i;

/**
 * Attribution separator. Accepts an em dash, an en dash or a hyphen after the
 * pipe, and the pipe alone — a paste from a word processor will have had its
 * dash silently changed and that must not cost the author the attribution.
 */
const ATTRIB_SPLIT = /\s*\|\s*[—–-]?\s*/;

export interface ParseResult {
  blocks: StoryBlock[];
  /** Per-type tallies, so the editor can say what it produced without a diff. */
  counts: Record<StoryBlock['type'], number>;
  /**
   * Lines that carried a marker this parser could not resolve and so became
   * prose. Reported, never thrown: the author decides whether it was a typo.
   */
  reclassified: string[];
}

const emptyCounts = (): Record<StoryBlock['type'], number> => ({
  paragraph: 0, heading: 0, image: 0, quote: 0, leaderboard: 0, player: 0,
});

/** Anything bracket- or bang-shaped that MEANT to be a marker and missed. */
function looksLikeAMarker(line: string): boolean {
  return /^!\[/.test(line) || /^\[(leaderboard|player)/i.test(line);
}

export function parseStoryText(source: string): ParseResult {
  const blocks: StoryBlock[] = [];
  const counts = emptyCounts();
  const reclassified: string[] = [];

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
      const id = embed[2].trim();
      if (embed[1].toLowerCase() === 'leaderboard') push({ type: 'leaderboard', tournament_id: id });
      else push({ type: 'player', player_id: id });
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

  return { blocks, counts, reclassified };
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
