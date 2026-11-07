/** Creator-only video metadata. Chapters are derived, never persisted; this
 * module is shared with future readers so timestamp qualification has one owner.
 * Exactly-one-video submission is the sole gate for the three metadata writes.
 */
import { isLongFormVideo } from '@/constants/videoRules';
export const VIDEO_LIMITS = { title: 80, credits: 10, links: 5, thanks: 3, gear: 10, gearText: 60, url: 300, label: 30 } as const;
export const CREDIT_ROLES = [['host', 'Host'], ['guest', 'Guest'], ['filmed', 'Filmed'], ['edited', 'Edited'], ['filmed_edited', 'Filmed & edited']] as const;
export type CreditRole = typeof CREDIT_ROLES[number][0];
export interface VideoCredit { id: string; name: string; avatarUrl: string | null; role: CreditRole }
export interface VideoThanks { id: string; name: string; logoUrl: string | null; category: string | null }
export interface VideoLink { url: string; label: string }
export interface VideoDetails { title: string; titleOnCover: boolean; links: VideoLink[]; gear: string[]; credits: VideoCredit[]; thanks: VideoThanks[]; coverFrame: number | null }
export const emptyVideoDetails = (): VideoDetails => ({ title: '', titleOnCover: true, links: [], gear: [], credits: [], thanks: [], coverFrame: null });
export function restoreVideoDetails(value: unknown): VideoDetails {
  if (!value || typeof value !== 'object') return emptyVideoDetails();
  const v = value as Partial<VideoDetails>;
  return { title: typeof v.title === 'string' ? v.title : '', titleOnCover: v.titleOnCover !== false, links: Array.isArray(v.links) ? v.links : [], gear: Array.isArray(v.gear) ? v.gear : [], credits: Array.isArray(v.credits) ? v.credits : [], thanks: Array.isArray(v.thanks) ? v.thanks : [], coverFrame: typeof v.coverFrame === 'number' ? v.coverFrame : null };
}
export function singleVideo(media: readonly { type: string }[], editing = false): boolean { return !editing && media.length === 1 && media[0].type === 'video'; }
export interface VideoChapter { seconds: number; time: string; label: string }
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