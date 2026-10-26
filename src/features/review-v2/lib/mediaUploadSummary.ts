import type { MediaItem } from '../types';
export function mediaUploadSummary(items: MediaItem[]) {
  const fresh = items.filter(i => !i.isExisting && i.status !== 'existing');
  const total = fresh.length; const uploaded = fresh.filter(i => i.status === 'uploaded' || i.status === 'ready').length;
  const failed = fresh.filter(i => i.status === 'failed').length;
  const active = fresh.some(i => i.status === 'pending' || i.status === 'uploading' || i.analysing);
  const bytes = fresh.reduce((sum, i) => sum + (i.file?.size ?? 0), 0);
  const loaded = fresh.reduce((sum, i) => sum + (i.file?.size ?? 0) * ((i.status === 'uploaded' || i.status === 'ready') ? 1 : Math.max(0, Math.min(100, i.progress)) / 100), 0);
  return { total, uploaded, failed, active, percent: bytes ? Math.round(loaded / bytes * 100) : 0 };
}
export function mediaCountKey(items: MediaItem[]) {
  const videos = items.filter(i => i.type === 'video').length;
  return videos && videos < items.length ? 'summaryMixed' : videos ? items.length === 1 ? 'summaryVideo' : 'summaryVideos' : items.length === 1 ? 'summaryPhoto' : 'summaryPhotos';
}
