import type { DbMediaRow, MediaItem } from '@/types/media';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';

export function mapDbToMediaItem(row: DbMediaRow): MediaItem {
  const streamId = row.media_type === 'video' ? (getStreamIdFromUrl(row.media_url) ?? null) : null;
  return {
    id: row.id,
    type: row.media_type,
    url: row.media_url,
    posterUrl: row.poster_url ?? (streamId ? getStreamPoster(streamId, '1s') : null),
    streamId,
    alt: row.file_name ?? null,
  };
}

/** Strict: do not cast arrays; always map. */
export function mapDbListToMediaItems(rows: DbMediaRow[] | undefined | null): MediaItem[] {
  return (rows ?? []).map(mapDbToMediaItem);
}