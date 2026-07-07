/**
 * Mentions v2 — canonical storage format.
 *
 * Inline markup embedded in the content text itself:
 *   @[Display Name](u:USER_UUID)      — user mention
 *   @[Business Name](b:BUSINESS_UUID) — business mention
 *
 * This file is the ONLY place the mention regex is defined. Any renderer,
 * extractor, or preview stripper must import from here.
 */

// UUID: 8-4-4-4-12 hex (case-insensitive). Display: any chars except the closing `]`.
export const MENTION_REGEX =
  /@\[([^\]]+)\]\((u|b):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g;

export type MentionEntityType = 'user' | 'business';

export interface MentionSegment {
  kind: 'text' | 'mention';
  text: string;
  entityType?: MentionEntityType;
  entityId?: string;
}

export interface ExtractedMention {
  entityType: MentionEntityType;
  entityId: string;
  display: string;
}

const kindOf = (ch: 'u' | 'b'): MentionEntityType => (ch === 'u' ? 'user' : 'business');

/**
 * Split `text` into a linear array of text/mention segments. Malformed markup
 * simply stays inside a text segment (never crashes; regex just doesn't match).
 */
export function parseMentionSegments(text: string): MentionSegment[] {
  if (!text) return [];
  const out: MentionSegment[] = [];
  const re = new RegExp(MENTION_REGEX.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ kind: 'text', text: text.slice(last, m.index) });
    }
    out.push({
      kind: 'mention',
      text: m[1],
      entityType: kindOf(m[2] as 'u' | 'b'),
      entityId: m[3].toLowerCase(),
    });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ kind: 'text', text: text.slice(last) });
  }
  return out;
}

/** Deduped list of (entityType, entityId) with the first-seen display name. */
export function extractMentions(text: string): ExtractedMention[] {
  const seen = new Set<string>();
  const out: ExtractedMention[] = [];
  for (const seg of parseMentionSegments(text)) {
    if (seg.kind !== 'mention' || !seg.entityId || !seg.entityType) continue;
    const key = `${seg.entityType}:${seg.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ entityType: seg.entityType, entityId: seg.entityId, display: seg.text });
  }
  return out;
}

/** Build the canonical markup for a single mention. */
export function serializeMention(input: {
  display: string;
  entityType: MentionEntityType;
  entityId: string;
}): string {
  const safeDisplay = (input.display ?? '').replace(/\]/g, ''); // ']' would break the format
  const kind = input.entityType === 'user' ? 'u' : 'b';
  return `@[${safeDisplay}](${kind}:${input.entityId})`;
}

/**
 * Strip markup to plain "@Display Name" for previews, push copy, share text.
 */
export function stripMentionMarkup(text: string): string {
  if (!text) return '';
  return text.replace(new RegExp(MENTION_REGEX.source, 'g'), (_all, display) => `@${display}`);
}

/** Diff two mention sets by (entityType, entityId) key. */
export function diffMentions(
  before: ExtractedMention[],
  after: ExtractedMention[],
): { added: ExtractedMention[]; removed: ExtractedMention[] } {
  const beforeKeys = new Set(before.map(m => `${m.entityType}:${m.entityId}`));
  const afterKeys = new Set(after.map(m => `${m.entityType}:${m.entityId}`));
  return {
    added: after.filter(m => !beforeKeys.has(`${m.entityType}:${m.entityId}`)),
    removed: before.filter(m => !afterKeys.has(`${m.entityType}:${m.entityId}`)),
  };
}
