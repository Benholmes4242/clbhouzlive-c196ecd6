/** PF3B read-side model: eligibility stays single-video only and chapters are
 * derived by the composer parser, never stored or parsed a second way. */
import type { FeedPost } from '@/components/media-system/types/media';
import { parseChapters, holeChapters, type CreditRole, type VideoChapter, type VideoLink, type HoleMarks } from '@/features/post-v2/lib/videoDetails';
import { isLongFormVideo } from '@/constants/videoRules';
import type { PostGolfContext } from '@/hooks/feed/usePostGolfContext';
export interface PostVideoDetails {
  postId: string; title: string; titleOnCover: boolean; links: VideoLink[]; gear: string[];
  scoreFollows?: boolean; holeMarks?: HoleMarks;
  credits: { profileId: string; role: CreditRole; name: string; username: string | null; avatarUrl: string | null }[];
  thanks: { businessId: string; name: string; slug: string | null; logoUrl: string | null; category: string | null }[];
}
const records = (v: unknown): Record<string, unknown>[] => Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : [];
const text = (v: unknown): string => typeof v === 'string' ? v : '';
export function normalizeVideoDetails(row: Record<string, unknown>): PostVideoDetails {
  const holeMarks: HoleMarks = {};
  for (const mark of records(row.hole_chapters)) { const h = Number(mark.hole_no), t = Number(mark.start_seconds); if (Number.isInteger(h) && h >= 1 && h <= 18 && Number.isFinite(t) && t >= 1) holeMarks[h] = t; }
  return { postId: text(row.post_id), title: text(row.title).trim(), titleOnCover: row.title_on_cover !== false, scoreFollows: row.score_follows !== false, holeMarks,
    links: records(row.links).map(x => ({ url: text(x.url), label: text(x.label) })), gear: Array.isArray(row.gear) ? row.gear.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [],
    credits: records(row.credits).map(x => ({ profileId: text(x.profile_id), role: text(x.role) as CreditRole, name: text(x.name), username: text(x.username) || null, avatarUrl: text(x.avatar_url) || null })),
    thanks: records(row.thanks).map(x => ({ businessId: text(x.business_id), name: text(x.name), slug: text(x.slug) || null, logoUrl: text(x.logo_url) || null, category: text(x.category) || null })) };
}
export function singleVideoPostIds(posts: readonly Pick<FeedPost, 'id' | 'mediaItems'>[]): string[] {
  return [...new Set(posts.filter(p => p.mediaItems.length === 1 && p.mediaItems[0]?.type === 'video').map(p => p.id))];
}
export function chaptersForPost(post: Pick<FeedPost, 'caption' | 'mediaItems'> & Partial<Pick<FeedPost, 'actorType'>> | null, details?: PostVideoDetails | null, context?: PostGolfContext | null): VideoChapter[] {
  if (!post || post.mediaItems.length !== 1 || post.mediaItems[0]?.type !== 'video') return [];
  const duration = post.mediaItems[0].duration;
  if (post.actorType !== 'business' && context?.roundScoreId && isLongFormVideo(duration) && duration != null) { const holes = holeChapters(details?.holeMarks ?? {}, context.roundHoles ?? 0, duration); if (holes.length) return holes; }
  return parseChapters(post.caption ?? '', duration);
}
export function isDetailedVideo(post: Pick<FeedPost, 'caption' | 'mediaItems'> & Partial<Pick<FeedPost, 'actorType'>> | null, details?: PostVideoDetails | null, context?: PostGolfContext | null): boolean {
  if (!post || post.mediaItems.length !== 1 || post.mediaItems[0]?.type !== 'video') return false;
  return !!(details?.title || details?.credits.length || details?.thanks.length || details?.links.length || details?.gear.length || chaptersForPost(post, details, context).length);
}
export function currentChapter(chapters: readonly VideoChapter[], seconds: number): VideoChapter | null {
  return [...chapters].reverse().find(c => seconds >= c.seconds) ?? null;
}
export function chapterFractions(chapters: readonly VideoChapter[], duration: number): number[] {
  return duration > 0 ? chapters.map((c, i) => Math.max(0, ((chapters[i + 1]?.seconds ?? duration) - c.seconds) / duration)) : [];
}