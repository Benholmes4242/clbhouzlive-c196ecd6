/** Build 4 clubhouse/reach payloads and copy. Defensive parsers fail closed;
 * every sentence is built here so the card, the sheet and tests share one
 * wording. OWGR dates format as "d Mon yyyy" from their ISO date only. */
import { MONTHS, type WorldRank } from './proProfileRules';
import { orderedBag, type BagItem } from './proCollectionRules';

export interface ClubhouseFace { id: string; name: string; username: string; avatar: string | null }
export interface ProClubhouse {
  followers: number;
  club: string | null;
  club_followers: number;
  watchers: number;
  mutual_count: number;
  mutuals: ClubhouseFace[];
  recent: ClubhouseFace[];
}
export interface ProReach { views_30: number; new_followers_30: number; questions_30: number; tracking_since: string | null }

const face = (value: unknown): ClubhouseFace | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id) return null;
  return {
    id: row.id,
    name: typeof row.name === 'string' ? row.name : '',
    username: typeof row.username === 'string' ? row.username : '',
    avatar: typeof row.avatar === 'string' ? row.avatar : null,
  };
};
const faces = (value: unknown): ClubhouseFace[] =>
  (Array.isArray(value) ? value : []).map(face).filter((f): f is ClubhouseFace => !!f).slice(0, 3);
const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0);

export function parseProClubhouse(value: unknown): ProClubhouse | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || typeof v !== 'object' || typeof (v as Record<string, unknown>).followers !== 'number') return null;
  const row = v as Record<string, unknown>;
  return {
    followers: count(row.followers),
    club: typeof row.club === 'string' && row.club ? row.club : null,
    club_followers: count(row.club_followers),
    watchers: count(row.watchers),
    mutual_count: count(row.mutual_count),
    mutuals: faces(row.mutuals),
    recent: faces(row.recent),
  };
}

export function parseProReach(value: unknown): ProReach | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || typeof v !== 'object') return null;
  const row = v as Record<string, unknown>;
  if (typeof row.views_30 !== 'number') return null;
  return {
    views_30: count(row.views_30),
    new_followers_30: count(row.new_followers_30),
    questions_30: count(row.questions_30),
    tracking_since: typeof row.tracking_since === 'string' && row.tracking_since ? row.tracking_since : null,
  };
}

/** Visitors see mutual faces when there are any, otherwise recent; his own
 * view always shows recent. */
export const clubhouseFaces = (data: ProClubhouse, owner: boolean): ClubhouseFace[] =>
  owner ? data.recent : data.mutuals.length > 0 ? data.mutuals : data.recent;

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** The clubhouse sentence as a bold lead plus the plain remainder, so the
 * card renders one paragraph with the bold part in ink. */
export function clubhouseCopy(data: ProClubhouse, owner: boolean, first: string): { bold: string; plain: string } {
  if (owner) {
    if (data.followers === 0) return { bold: 'No followers yet.', plain: " Share your profile and they'll show here." };
    const bold = data.followers === 1 ? '1 member follows you' : `${data.followers.toLocaleString('en-GB')} members follow you`;
    const club = data.club && data.club_followers > 0 ? `, ${data.club_followers} of them from ${data.club}.` : '.';
    const watchers = data.watchers > 0
      ? data.watchers === 1 ? ' 1 member gets your scores each day.' : ` ${data.watchers.toLocaleString('en-GB')} members get your scores each day.`
      : '';
    return { bold, plain: `${club}${watchers}` };
  }
  const names = data.mutuals.map((m) => firstName(m.name));
  let bold: string;
  let plain: string;
  if (data.mutual_count >= 3 && names.length > 0) {
    bold = `${names[0]} and ${data.mutual_count - 1} others you follow`;
    plain = ` follow ${first}.`;
  } else if (data.mutual_count === 2 && names.length >= 2) {
    bold = `${names[0]} and ${names[1]}`;
    plain = `, who you follow, follow ${first}.`;
  } else if (data.mutual_count === 1 && names.length > 0) {
    bold = names[0];
    plain = `, who you follow, follows ${first}.`;
  } else {
    bold = data.followers === 1 ? `1 member follows ${first}` : `${data.followers.toLocaleString('en-GB')} members follow ${first}`;
    plain = '.';
  }
  if (data.club && data.club_followers > 0) {
    plain += data.club_followers === 1
      ? ` 1 of his followers is from ${data.club}.`
      : ` ${data.club_followers} of his followers are from ${data.club}.`;
  }
  return { bold, plain };
}

const joinWords = (words: string[]) =>
  words.length <= 1 ? words.join('') : words.length === 2 ? `${words[0]} and ${words[1]}` : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

/** "Fairway Labs driver and fairway · Ridgeback irons and wedges · …" —
 * brands in bag order, slots lowercase within each brand. */
export function bagLine(items: BagItem[]): string {
  const groups: { brand: string; slots: string[] }[] = [];
  for (const item of orderedBag(items)) {
    const existing = groups.find((g) => g.brand === item.brand);
    if (existing) { if (!existing.slots.includes(item.slot)) existing.slots.push(item.slot); }
    else groups.push({ brand: item.brand, slots: [item.slot] });
  }
  return groups.map((g) => `${g.brand} ${joinWords(g.slots)}`).join(' · ');
}

export const formatDay = (date: Date) => `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
const parseDay = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);

/** The sheet's source line: dated OWGR credit when ranking data exists,
 * otherwise the plain made-on line. */
export function sponsorSourceLine(rank: WorldRank | null, today = new Date()): string {
  if (rank?.ranking_date) {
    return `World ranking and results: Official World Golf Ranking, ${formatDay(parseDay(rank.ranking_date))}. Everything else: clbhouz, ${formatDay(today)}.`;
  }
  return `Made on clbhouz, ${formatDay(today)}.`;
}

/** Shown while the view count covers less than a full 30 days. A null
 * tracking_since means counting starts now, so it reads from today. */
export function trackingFromLine(tracking_since: string | null, today = new Date()): string | null {
  if (tracking_since) {
    const since = parseDay(tracking_since);
    if (today.getTime() - since.getTime() >= 30 * 24 * 60 * 60 * 1000) return null;
    return `Views are counted from ${formatDay(since)}.`;
  }
  return `Views are counted from ${formatDay(today)}.`;
}
