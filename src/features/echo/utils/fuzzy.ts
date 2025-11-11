import { tokenizeQuery } from './highlight';

export function fuzzyScore(text: string, query: string): number {
  if (!text || !query) return 0;
  const t = text.toLowerCase();
  const toks = tokenizeQuery(query).map((x) => x.toLowerCase());
  let score = 0;
  for (const tok of toks) {
    // contains = 2, startsWith = 3, full word = 4
    if (t.includes(tok)) score += 2;
    if (t.startsWith(tok)) score += 3;
    const wordRe = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRe.test(t)) score += 4;
  }
  return score;
}
