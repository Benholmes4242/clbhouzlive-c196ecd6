/**
 * Cloudflare Stream UID utilities.
 * Extracted from src/utils/videoIdUtils.ts for the Stage E teardown so
 * rebuild-critical consumers survive the sweep.
 */

import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';

const UID_RE = /([a-f0-9]{32})/i;

/** Build the HLS manifest URL for a Cloudflare Stream UID (or accepts a full URL). */
export function buildHlsUrl(uidOrUrl: string): string {
  const uid = extractCloudflareUid(uidOrUrl);
  if (!uid) return '';
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${uid}/manifest/video.m3u8`;
}

export function extractCloudflareUid(input: string): string {
  if (!input) return '';
  if (/^[a-f0-9]{32}$/i.test(input)) return input.toLowerCase();

  const cfMatch = input.match(/cloudflarestream\.com\/([a-f0-9]{32})/i);
  if (cfMatch) return cfMatch[1].toLowerCase();

  const hexMatch = input.match(UID_RE);
  if (hexMatch) return hexMatch[1].toLowerCase();

  return '';
}

export function shortUid(uid: string): string {
  return uid ? uid.slice(0, 8) : 'unknown';
}

export function isCloudflareUid(id: string): boolean {
  return /^[a-f0-9]{32}$/i.test(id);
}

export function getCloudflareUidFromPost(post: {
  video_url?: string | null;
  cloudflare_uid?: string | null;
  media_url?: string | null;
}): string {
  if (post.cloudflare_uid) return extractCloudflareUid(post.cloudflare_uid);
  if (post.video_url) return extractCloudflareUid(post.video_url);
  if (post.media_url) return extractCloudflareUid(post.media_url);
  return '';
}

export function getCloudflareUidFromMedia(item: {
  media?: Array<{ media_url?: string | null; media_type?: string | null }>;
}): string {
  if (!item.media?.length) return '';
  const videoMedia = item.media.find((m) => m.media_type === 'video');
  if (videoMedia?.media_url) return extractCloudflareUid(videoMedia.media_url);
  return '';
}
