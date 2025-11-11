// Highlighting utilities for search result highlighting

import React from 'react';

/** Strip diacritics (é -> e) for matching while preserving original text for render */
export function normalizeForMatch(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Tokenize query: supports quoted phrases and single terms; ignores <2 char noise */
export function tokenizeQuery(raw: string): string[] {
  if (!raw) return [];
  const q = normalizeForMatch(raw).toLowerCase();
  const phrases: string[] = [];

  // 1) pull "quoted phrases"
  const reQuoted = /"([^"]+)"/g;
  let m: RegExpExecArray | null;
  const consumed: number[] = [];

  while ((m = reQuoted.exec(q))) {
    const phrase = m[1].trim();
    if (phrase.length >= 2) phrases.push(phrase);
    consumed.push(m.index, reQuoted.lastIndex);
  }

  // 2) remove quoted segments and split remaining
  const qUnquoted = q.replace(/"[^"]+"/g, ' ');
  const singleTerms = qUnquoted
    .split(/[\s,;]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);

  // de-dupe while preserving order (phrases first)
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of [...phrases, ...singleTerms]) {
    if (!seen.has(p)) { seen.add(p); out.push(p); }
  }
  return out;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type MatchRange = { start: number; end: number }; // [start, end)

/** Find all match ranges for any token/phrase; merge overlaps */
export function findMatchRanges(text: string, query: string): MatchRange[] {
  if (!text || !query) return [];
  const norm = normalizeForMatch(text).toLowerCase();
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  const ranges: MatchRange[] = [];
  for (const tok of tokens) {
    const re = new RegExp(esc(tok), 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm))) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
      // prevent infinite loop on zero-length (shouldn't happen, but be safe)
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }
  if (ranges.length === 0) return [];

  // sort + merge
  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: MatchRange[] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = ranges[i];
    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/** Produce renderable segments preserving the original text */
export function segmentText(text: string, ranges: MatchRange[]): { text: string; match: boolean }[] {
  if (!text || ranges.length === 0) return [{ text, match: false }];
  const segs: { text: string; match: boolean }[] = [];
  let i = 0;
  for (const r of ranges) {
    if (i < r.start) segs.push({ text: text.slice(i, r.start), match: false });
    segs.push({ text: text.slice(r.start, r.end), match: true });
    i = r.end;
  }
  if (i < text.length) segs.push({ text: text.slice(i), match: false });
  return segs;
}

/** Convenience: compute segments directly from text + query */
export function highlightSegments(text: string, query: string) {
  return segmentText(text, findMatchRanges(text, query));
}

/** Temporary legacy wrapper - will be replaced in Phase 2 */
export function highlight(text: string, query: string | undefined): React.ReactNode {
  if (!query?.trim() || !text) return text;
  
  const segs = highlightSegments(text, query);
  
  return segs.map((seg, i) => {
    if (seg.match) {
      return React.createElement('mark', { key: i, 'aria-hidden': 'true' }, seg.text);
    }
    return React.createElement('span', { key: i }, seg.text);
  });
}
