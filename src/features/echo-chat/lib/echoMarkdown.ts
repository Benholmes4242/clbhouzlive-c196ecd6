/**
 * BRIEF_ECHO_MARKDOWN §1 — A RESTRICTED SUBSET, MAPPED TO THIS APP'S TYPE.
 *
 * NO MARKDOWN LIBRARY. A generic renderer brings its own type scale, its own
 * link colour and its own list styling, and Echo would stop looking like this
 * app within one release. This parser recognises exactly four things:
 *
 *   paragraph   the body tone
 *   **bold**    weight 700 in the brighter ink tier — NOT a colour change
 *   ## heading  the app's LABEL style, a section marker inside an answer
 *   - item      a tight list with a solid bullet, body tone
 *
 * EVERYTHING ELSE IS STRIPPED, NOT RENDERED — links, images, code, tables,
 * blockquotes, horizontal rules, headings deeper than `##`. The syntax goes,
 * the TEXT STAYS. A table in a chat bubble on a phone is unreadable.
 *
 * THIS IS A CLIENT CONCERN, NOT A PROMPT ONE. A prompt instruction to avoid
 * markdown holds until it does not, and then the characters are back on screen.
 *
 * UNMATCHED MARKERS RENDER AS TEXT. A lone `**` with no closing pair prints as
 * `**` and never swallows the rest of the answer (see `inline()`).
 */

export interface Span {
  text: string;
  bold?: boolean;
}

export type EchoBlock =
  | { kind: 'p'; spans: Span[] }
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: Array<{ marker: string | null; spans: Span[] }> };

/** Strip inline syntax we do not render, keeping the words. */
function stripInline(raw: string): string {
  return (
    raw
      // Images first (they are links with a bang) — keep the alt text only.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Links: the label is the text, the URL is dropped.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Bare autolinks <https://…>.
      .replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, '$1')
      // Inline code — keep the contents, drop the ticks.
      .replace(/`+([^`]*)`+/g, '$1')
      // Italics/emphasis have no design here: strip the marks, keep the text.
      // Runs of 3+ asterisks collapse to bold, handled by the bold pass below.
      .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=$|[\s.,;:!?)])/g, '$1$2')
      // Strikethrough.
      .replace(/~~([^~]*)~~/g, '$1')
      .trim()
  );
}

/**
 * Split a line into bold / plain spans.
 *
 * AN UNMATCHED `**` IS TEXT. We only open a bold span when a closing `**`
 * exists later on the same line; otherwise the marker is emitted verbatim and
 * the remainder of the answer keeps rendering as ordinary prose.
 */
export function inline(raw: string): Span[] {
  const src = stripInline(raw);
  const spans: Span[] = [];
  let buf = '';
  let i = 0;

  const flush = () => {
    if (buf) spans.push({ text: buf });
    buf = '';
  };

  while (i < src.length) {
    const isMarker = src.startsWith('**', i) || src.startsWith('__', i);
    if (!isMarker) {
      buf += src[i];
      i += 1;
      continue;
    }
    const marker = src.slice(i, i + 2);
    const close = src.indexOf(marker, i + 2);
    if (close === -1 || close === i + 2) {
      // No closing pair (or an empty one): the marker is literal text.
      buf += marker;
      i += 2;
      continue;
    }
    const inner = src.slice(i + 2, close);
    flush();
    spans.push({ text: inner, bold: true });
    i = close + 2;
  }

  flush();
  return spans;
}

const HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*(?:```|~~~)/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const BULLET = /^\s{0,3}[-*+•]\s+(.*)$/;
const ORDERED = /^\s{0,3}(\d{1,2})[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*)$/;

/** Normalise a table row into a readable sentence fragment. */
function tableRow(line: string): string {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean)
    .join(' · ');
}

/**
 * Parse Echo's answer text into the four blocks we have a design for.
 * Anything else is reduced to a paragraph carrying its plain text.
 */
export function parseEchoMarkdown(text: string): EchoBlock[] {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: EchoBlock[] = [];
  let para: string[] = [];
  let list: Array<{ marker: string | null; spans: Span[] }> | null = null;
  let inFence = false;

  const closePara = () => {
    if (para.length === 0) return;
    const spans = inline(para.join(' '));
    if (spans.some((s) => s.text.trim())) blocks.push({ kind: 'p', spans });
    para = [];
  };
  const closeList = () => {
    if (list && list.length > 0) blocks.push({ kind: 'ul', items: list });
    list = null;
  };
  const closeAll = () => {
    closePara();
    closeList();
  };

  for (const rawLine of lines) {
    // Code fences: the fence markers vanish, the lines inside stay as prose.
    if (FENCE.test(rawLine)) {
      inFence = !inFence;
      closeAll();
      continue;
    }

    let line = rawLine;
    if (!line.trim()) {
      closeAll();
      continue;
    }
    if (HR.test(line) || TABLE_SEP.test(line)) {
      closeAll();
      continue;
    }
    // Blockquote: the mark goes, the sentence stays.
    line = line.replace(/^\s{0,3}>\s?/, '');
    // Table row: cells joined, never a grid.
    if (!inFence && /^\s*\|.*\|\s*$/.test(line)) {
      closeList();
      para.push(tableRow(line));
      continue;
    }

    const heading = !inFence ? HEADING.exec(line) : null;
    if (heading) {
      closeAll();
      const depth = heading[1].length;
      const body = stripInline(heading[2]);
      if (!body) continue;
      // `#` and `##` are section markers. DEEPER HEADINGS HAVE NO DESIGN —
      // they render as ordinary prose rather than inventing a third scale.
      if (depth <= 2) blocks.push({ kind: 'h', text: body });
      else para.push(body);
      continue;
    }

    const bullet = !inFence ? BULLET.exec(line) : null;
    const ordered = !inFence && !bullet ? ORDERED.exec(line) : null;
    if (bullet || ordered) {
      closePara();
      const body = bullet ? bullet[1] : (ordered as RegExpExecArray)[2];
      const spans = inline(body);
      if (!spans.some((s) => s.text.trim())) continue;
      if (!list) list = [];
      list.push({ marker: ordered ? `${ordered[1]}` : null, spans });
      continue;
    }

    closeList();
    para.push(line.trim());
  }

  closeAll();
  return blocks;
}
