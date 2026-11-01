/** Tour News page pure rules (BRIEF_TOUR_NEWS_PAGE). Archive grouping, Your
 * players selection, Top stories assignment, event chips, search highlighting
 * and the event-card copy. No reads, no locale, no DOM — dates are injected. */
import type { TourStory } from './useTourStories';
import { storyPlayerIds } from '../overview/sections/overviewNewsRules';

export const NEWS_PAGE_SIZE = 10;
export const YOUR_PLAYERS_DAYS = 30;
export const YOUR_PLAYERS_CAP = 3;
export const EVENT_CHIP_MIN = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_UPPER = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'] as const;
const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;
const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export function storyDay(iso: string | null): Date | null {
  const t = Date.parse(iso ?? '');
  return Number.isFinite(t) ? new Date(t) : null;
}

/** Two-digit day of month for the archive date block. */
export function archiveDay(date: Date): string {
  return String(date.getDate()).padStart(2, '0');
}
export function archiveWeekday(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()];
}
export function archiveMonthShort(date: Date): string {
  return MONTHS_SHORT[date.getMonth()];
}

export interface ArchiveGroup {
  key: string;
  label: string;
  stories: TourStory[];
}

/** THIS WEEK (Mon–Sun of the current week), LAST WEEK, then each earlier
 * month by name, with the year when it is not the current year. */
export function archiveGroups(stories: TourStory[], now: Date = new Date()): ArchiveGroup[] {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const mondayOffset = (now.getDay() + 6) % 7;
  const weekStart = todayStart - mondayOffset * DAY_MS;
  const lastWeekStart = weekStart - 7 * DAY_MS;
  const groups: ArchiveGroup[] = [];
  const byKey = new Map<string, ArchiveGroup>();
  const push = (key: string, label: string, story: TourStory) => {
    let group = byKey.get(key);
    if (!group) {
      group = { key, label, stories: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.stories.push(story);
  };
  for (const story of stories) {
    const date = storyDay(story.published_at);
    if (!date) continue;
    const t = date.getTime();
    if (t >= weekStart) push('this-week', 'THIS WEEK', story);
    else if (t >= lastWeekStart) push('last-week', 'LAST WEEK', story);
    else {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = MONTHS_UPPER[date.getMonth()] + (date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : '');
      push(key, label, story);
    }
  }
  return groups;
}

/** YOUR PLAYERS: stories from the last 30 days featuring a followed player,
 * excluding the lead, newest first (input order), at most three. */
export function yourPlayersStories(
  stories: TourStory[],
  follows: Set<string>,
  leadId: string | undefined,
  now: Date = new Date(),
): TourStory[] {
  if (follows.size === 0) return [];
  const cutoff = now.getTime() - YOUR_PLAYERS_DAYS * DAY_MS;
  return stories
    .filter((s) => {
      if (s.id === leadId) return false;
      const t = Date.parse(s.published_at ?? '');
      if (!Number.isFinite(t) || t < cutoff) return false;
      return storyPlayerIds(s).some((id) => follows.has(id));
    })
    .slice(0, YOUR_PLAYERS_CAP);
}

export interface TopStories {
  pair: TourStory[];
  rows: TourStory[];
}

/** TOP STORIES: the pair (only when two remain) and up to three rows, in
 * order, from the stories not already shown above. */
export function assignTopStories(stories: TourStory[], excludeIds: Set<string>): TopStories {
  const pool = stories.filter((s) => !excludeIds.has(s.id));
  const pair = pool.length >= 2 ? pool.slice(0, 2) : [];
  return { pair, rows: pool.slice(pair.length, pair.length + 3) };
}

export interface EventChip {
  id: string;
  count: number;
  newestAt: number;
}

/** BY EVENT chips from the archive pool: one per tournament that has stories,
 * ordered by its newest story. The rail renders only at three or more. */
export function eventChips(stories: TourStory[]): EventChip[] {
  const byId = new Map<string, EventChip>();
  for (const s of stories) {
    if (!s.tournament_id) continue;
    const at = Date.parse(s.published_at ?? '') || 0;
    const existing = byId.get(s.tournament_id);
    if (existing) {
      existing.count += 1;
      existing.newestAt = Math.max(existing.newestAt, at);
    } else {
      byId.set(s.tournament_id, { id: s.tournament_id, count: 1, newestAt: at });
    }
  }
  return [...byId.values()].sort((a, b) => b.newestAt - a.newestAt);
}

/** Case-insensitive match segments for search highlighting. */
export function highlightSegments(text: string, query: string): { text: string; match: boolean }[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const out: { text: string; match: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(needle, i);
    if (at === -1) {
      out.push({ text: text.slice(i), match: false });
      break;
    }
    if (at > i) out.push({ text: text.slice(i, at), match: false });
    out.push({ text: text.slice(at, at + needle.length), match: true });
    i = at + needle.length;
  }
  return out.length ? out : [{ text, match: false }];
}

const MARGIN_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;
export function marginWord(n: number): string {
  return n >= 0 && n <= 10 ? MARGIN_WORDS[n] : String(n);
}

/** "Starts Thu 5 Nov · in 3 days" — today/tomorrow forms, date bolded by the
 * caller. Null when there is no start date. */
export function eventStartLine(startIso: string | null | undefined, now: Date = new Date()): { date: string; countdown: string } | null {
  const start = storyDay(startIso ?? null);
  if (!start) return null;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((startDay - nowDay) / DAY_MS);
  const date = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(start);
  const countdown = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  return { date, countdown };
}
