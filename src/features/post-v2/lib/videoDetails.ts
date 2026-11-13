/** Video metadata and canonical chapter selection shared by creator/viewer.
 * Timestamp chapters remain derived; PF3C hole marks are round-bound persisted
 * times, never scores. One validator owns spacing, prefill and publication.
 */
import { isLongFormVideo } from '@/constants/videoRules';
import { stripMentionMarkup } from '@/lib/mentions/format';
export const VIDEO_LIMITS = { title: 80, credits: 10, links: 5, thanks: 3, gear: 10, gearText: 60, url: 300, label: 30 } as const;
export const CREDIT_ROLES = [['host', 'Host'], ['guest', 'Guest'], ['filmed', 'Filmed'], ['edited', 'Edited'], ['filmed_edited', 'Filmed & edited']] as const;
export type CreditRole = typeof CREDIT_ROLES[number][0];
export interface VideoCredit { id: string; name: string; avatarUrl: string | null; role: CreditRole }
export interface VideoThanks { id: string; name: string; logoUrl: string | null; category: string | null }
export interface VideoLink { url: string; label: string }
export type HoleMarks = Record<number, number>;
// Composer/drafts retain titleMarkup; readers and persisted video titles use plain title.
export interface VideoDetails { title: string; titleMarkup?: string; titleOnCover: boolean; links: VideoLink[]; gear: string[]; credits: VideoCredit[]; thanks: VideoThanks[]; coverFrame: number | null; holeMarks?: HoleMarks; scoreFollows?: boolean; marksRoundId?: string | null }
export const emptyVideoDetails = (): VideoDetails => ({ title: '', titleOnCover: true, links: [], gear: [], credits: [], thanks: [], coverFrame: null, holeMarks: {}, scoreFollows: true, marksRoundId: null });
export function restoreVideoDetails(value: unknown): VideoDetails {
  if (!value || typeof value !== 'object') return emptyVideoDetails();
  const v = value as Partial<VideoDetails>;
  const titleMarkup = typeof v.titleMarkup === 'string' ? v.titleMarkup : typeof v.title === 'string' ? v.title : '';
  const holeMarks: HoleMarks = {};
  if (v.holeMarks && typeof v.holeMarks === 'object') for (const [key, seconds] of Object.entries(v.holeMarks)) { const hole = Number(key); if (Number.isInteger(hole) && hole >= 1 && hole <= 18 && typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 1) holeMarks[hole] = seconds; }
  return { title: stripMentionMarkup(titleMarkup), titleMarkup, titleOnCover: v.titleOnCover !== false, links: Array.isArray(v.links) ? v.links : [], gear: Array.isArray(v.gear) ? v.gear : [], credits: Array.isArray(v.credits) ? v.credits : [], thanks: Array.isArray(v.thanks) ? v.thanks : [], coverFrame: typeof v.coverFrame === 'number' ? v.coverFrame : null, holeMarks, scoreFollows: v.scoreFollows !== false, marksRoundId: typeof v.marksRoundId === 'string' ? v.marksRoundId : null };
}
export function singleVideo(media: readonly { type: string }[], editing = false): boolean { return !editing && media.length === 1 && media[0].type === 'video'; }
export interface VideoChapter { seconds: number; time: string; label: string; holeNo?: number }
export const holeOrdinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`;
export const chapterTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export function markRefusal(marks: HoleMarks, hole: number, seconds: number, holes: number, duration: number): string | null {
  if ((holes !== 9 && holes !== 18) || !Number.isInteger(hole) || hole < 1 || hole > holes) return 'This hole is not in the attached round.';
  if (!Number.isFinite(seconds) || seconds < 1 || !Number.isFinite(duration)) return 'Choose a time after the Intro.';
  const entries = Object.entries(marks).map(([h, t]) => [Number(h), t] as const).filter(([h, t]) => h !== hole && h >= 1 && h <= holes && Number.isFinite(t)).sort((a, b) => a[0] - b[0]);
  const before = entries.filter(([h]) => h < hole).at(-1);
  const after = entries.find(([h]) => h > hole);
  if (seconds - (before?.[1] ?? 0) < 10) return `The ${holeOrdinal(hole)} has to start at least 10 seconds after ${before ? `the ${holeOrdinal(before[0])} (${chapterTime(before[1])})` : 'the Intro (0:00)'}.`;
  if (after && after[1] - seconds < 10) return `The ${holeOrdinal(hole)} has to start at least 10 seconds before the ${holeOrdinal(after[0])} (${chapterTime(after[1])}).`;
  if (duration - seconds < 10) return `The ${holeOrdinal(hole)} has to start at least 10 seconds before the end.`;
  return null;
}
export function validHoleMarks(marks: HoleMarks, holes: number, duration: number): HoleMarks {
  const valid: HoleMarks = {};
  for (const [h, t] of Object.entries(marks).sort((a, b) => Number(a[0]) - Number(b[0]))) if (!markRefusal(valid, Number(h), t, holes, duration)) valid[Number(h)] = t;
  return valid;
}
export function holeChapters(marks: HoleMarks, holes: number, duration: number): VideoChapter[] {
  const valid = Object.entries(validHoleMarks(marks, holes, duration)).map(([h, seconds]) => ({ seconds, time: chapterTime(seconds), label: holeOrdinal(Number(h)), holeNo: Number(h) })).sort((a, b) => a.seconds - b.seconds);
  return valid.length >= 2 ? [{ seconds: 0, time: '0:00', label: 'Intro' }, ...valid] : [];
}
export function premarkHoles(description: string, marks: HoleMarks, holes: number, duration: number): HoleMarks {
  const next = { ...marks };
  for (const line of description.split(/\r?\n/)) {
    const m = /^(\d+:\d{2}(?::\d{2})?)\s+(?:Hole\s+(\d+)|(\d+)(?:st|nd|rd|th)?(?:\s+hole)?)(?=\s|$)/i.exec(line);
    if (!m) continue;
    const parts = m[1].split(':').map(Number), hole = Number(m[2] ?? m[3]);
    if (parts.slice(1).some(n => n >= 60) || next[hole] != null) continue;
    const seconds = parts.reduce((s, n) => s * 60 + n, 0);
    if (!markRefusal(next, hole, seconds, holes, duration)) next[hole] = seconds;
  }
  return next;
}
export function roundBoundVideoDetails(details: VideoDetails, roundId: string | null): VideoDetails {
  return details.marksRoundId === roundId && roundId ? details : { ...details, holeMarks: {}, marksRoundId: roundId };
}
export function parseChapters(description: string, durationSeconds: number | null | undefined): VideoChapter[] {
  if (!isLongFormVideo(durationSeconds) || durationSeconds == null || !Number.isFinite(durationSeconds)) return [];
  const chapters: VideoChapter[] = [];
  for (const line of description.split(/\r?\n/)) {
    const match = /^(\d+:\d{2}(?::\d{2})?)\s+(.+)$/.exec(line);
    if (!match) continue;
    const parts = match[1].split(':').map(Number);
    if (parts.slice(1).some(n => n >= 60)) return [];
    const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
    const label = match[2].trim();
    if (!label) continue;
    chapters.push({ seconds, time: match[1], label });
  }
  if (chapters.length < 3 || chapters[0].seconds !== 0) return [];
  if (chapters.some((chapter, i) => i > 0 && chapter.seconds - chapters[i - 1].seconds < 10)) return [];
  if (durationSeconds - chapters[chapters.length - 1].seconds < 10) return [];
  return chapters;
}
export function detectVideoLink(input: string): (VideoLink & { glyph: string }) | null {
  const raw = input.trim();
  if (!raw || (/^[a-z][a-z\d+.-]*:/i.test(raw) && !raw.startsWith('https://'))) return null;
  const url = raw.startsWith('https://') ? raw : `https://${raw}`;
  if (url.length > VIDEO_LIMITS.url || /\s/.test(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.includes('.') || parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const matches = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    const [label, glyph] = matches('instagram.com') ? ['Instagram', 'IG'] : matches('youtube.com') || matches('youtu.be') ? ['YouTube', 'YT'] : matches('tiktok.com') ? ['TikTok', 'TT'] : matches('x.com') || matches('twitter.com') ? ['X', 'X'] : ['Website', 'WEB'];
    return { url, label, glyph };
  } catch { return null; }
}
export function videoDescriptionMeta(details: VideoDetails, chapters: number): string {
  return [chapters ? `${chapters} chapters` : '', details.credits.length ? `${details.credits.length} credits` : '', details.links.length ? `${details.links.length} links` : '', details.thanks.length ? `Thanks to ${details.thanks.length}` : '', details.gear.length ? `Gear ${details.gear.length}` : ''].filter(Boolean).join(' · ');
}
export function videoDuration(item: { duration?: number; trimStart?: number | null; trimEnd?: number | null }): number | undefined {
  return item.trimEnd != null ? Math.max(0, item.trimEnd - (item.trimStart ?? 0)) : item.duration;
}

/** Cover strip and sheet share absolute source times, including trim offset.
 * A custom choice replaces only suggestion zero; posterTimestamp wins metadata.
 */
export function videoCoverSelection(item: { duration?: number; trimStart?: number | null; trimEnd?: number | null; posterTimestamp?: number | null }, coverFrame: number | null | undefined) {
  const suggestions = [0.1, 0.35, 0.6, 0.85].map(part => (videoDuration(item) ?? 0) * part + (item.trimStart ?? 0));
  const chosen = item.posterTimestamp ?? coverFrame ?? suggestions[0];
  const match = suggestions.findIndex(time => Math.abs(chosen - time) <= 0.01);
  return { chosen, times: match < 0 ? [chosen, ...suggestions.slice(1)] : suggestions, selectedIndex: match < 0 ? 0 : match };
}