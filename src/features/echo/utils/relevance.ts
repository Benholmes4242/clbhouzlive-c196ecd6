import { tokenizeQuery } from './highlight.tsx';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function countMatches(text: string, query: string): number {
  if (!text || !query) return 0;
  const tokens = tokenizeQuery(query).map(s => s.toLowerCase());
  if (tokens.length === 0) return 0;
  const re = new RegExp(`(${tokens.map(esc).join('|')})`, 'ig');
  return (text.match(re) || []).length;
}

/** Weighted score: title > subtitle; tiny bonus for starred */
export function relevanceScore(
  title: string,
  subtitle: string,
  query: string,
  isStarred?: boolean
): number {
  const t = countMatches(title || '', query);
  const s = countMatches(subtitle || '', query);
  const base = t * 3 + s * 1;          // weights
  const starBonus = isStarred ? 0.25 : 0;
  return base + starBonus;
}
