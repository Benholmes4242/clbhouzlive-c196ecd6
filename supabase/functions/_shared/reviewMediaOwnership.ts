/** Ownership checks shared by review upload creation and cleanup. Client metadata is never authority. */
export function creatorMetadata(metadata: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !/creator|owner/i.test(key)));
}
export function ownedMediaKey(raw: string, userId: string, base: string): string | null {
  try {
    const url = new URL(raw); const origin = new URL(base);
    if (url.origin !== origin.origin || url.username || url.password || url.search || url.hash) return null;
    const prefix = origin.pathname.replace(/\/$/, '') + '/';
    if (!url.pathname.startsWith(prefix)) return null;
    const key = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!key.startsWith(`${userId}/`) || key.includes('\\') || key.includes('%') || key.split('/').some(p => !p || p === '.' || p === '..')) return null;
    // Reject normalization before URL parsing, including encoded dot segments.
    const rawPath = raw.slice(raw.indexOf('://') + 3).slice(raw.slice(raw.indexOf('://') + 3).indexOf('/'));
    if (/\/(?:\.|%2e)(?:\.|%2e)?(?:\/|%2f|$)/i.test(rawPath) || /%2f|%5c/i.test(rawPath)) return null;
    return key;
  } catch { return null; }
}
export type CleanupItem = { id?: string; media_url: string; media_type: 'image' | 'video'; stream_id: string | null };
export type CleanupStatus = 'deleted' | 'refused' | 'not_found';
export interface CleanupDependencies {
  videoDetails: (id: string) => Promise<{ creator?: string | null } | null>;
  ownsRow: (id: string) => Promise<boolean>;
  ownsLegacyVideo: (id: string) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<CleanupStatus>;
  deletePhoto: (key: string) => Promise<CleanupStatus>;
  deleteRow: (id: string) => Promise<void>;
  mediaBase: string;
}
export async function cleanupOwnedItem(item: CleanupItem, userId: string, deps: CleanupDependencies): Promise<CleanupStatus> {
  const ownedRow = item.id ? await deps.ownsRow(item.id) : false;
  let result: CleanupStatus;
  if (item.media_type === 'video' && item.stream_id) {
    const video = await deps.videoDetails(item.stream_id);
    if (!video) result = 'not_found';
    else if (video.creator ? video.creator !== userId : !await deps.ownsLegacyVideo(item.stream_id)) return 'refused';
    else result = await deps.deleteVideo(item.stream_id);
  } else if (item.media_type === 'image') {
    const key = ownedMediaKey(item.media_url, userId, deps.mediaBase);
    if (!key) return 'refused';
    result = await deps.deletePhoto(key);
  } else return 'refused';
  if (ownedRow && item.id && result !== 'refused') await deps.deleteRow(item.id);
  return result;
}
