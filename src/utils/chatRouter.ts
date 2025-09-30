export type Provider = 'openai' | 'perplexity';
export type RouteReason =
  | 'time keywords'
  | 'explicit year'
  | 'volatile entity'
  | 'model-declined'
  | 'default static';

const RECENCY = /(today|tonight|tomorrow|yesterday|this (week|month|year)|current|latest|now|live|right now|up-to-date|as of|breaking|recent)/i;
const YEAR = /\b20(2[3-9]|3[0-5])\b/; // explicit current/future years
const VOLATILE = /(leaderboard|pairings|tee times|result|price|schedule|fixture|odds|rankings|captain|coach|manager|injury|withdrawn|weather|pga|lpga|ryder cup|presidents cup)/i;

export function needsWeb(q: string): [boolean, RouteReason] {
  const p = q.toLowerCase();
  if (RECENCY.test(p)) return [true, 'time keywords'];
  if (YEAR.test(p)) return [true, 'explicit year'];
  if (VOLATILE.test(p)) return [true, 'volatile entity'];
  return [false, 'default static'];
}

// If OpenAI replies with a "cutoff/unknown/please check web", auto-switch on retry.
export function modelDeclined(text: string | undefined): boolean {
  if (!text) return false;
  const p = text.toLowerCase();
  return /\b(i (don'?t|do not) have (current|real-?time) info|knowledge cutoff|can'?t browse|check the web|not up to date)\b/.test(p);
}