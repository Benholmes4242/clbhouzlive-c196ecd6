/** Course gallery ordering and identity belong here; the fullscreen store owns
 * navigation and the canonical pager still owns media playback and gestures. */
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from './holePhotoData';
import { holeMediaKey } from './holePhotoData';
import type { PlaceMedia } from '@/components/course-media-tab/hooks/useCoursePlaceMedia';
import { COURSE_PLACES, type CoursePlace } from './places';
import { holeOrdinal } from './holeWalk';

export type GalleryFilter = 'all' | 'holes' | CoursePlace;
export interface CourseGalleryOptions { courseId: string; courseName: string; filter: GalleryFilter; startShotId?: string }
export interface GalleryShot {
  id: string; item: MediaItem; post: FeedPost; ownerId: string; name: string; avatar: string; addedAt: string;
  holeTag?: HolePhoto; placeTag?: PlaceMedia;
}
export interface GalleryData { shots: GalleryShot[]; holes: readonly CourseHole[]; scored: boolean }
export const galleryFit = (width: number, height: number) => height > 0 && width > 0 && width / height < .75 ? 'cover' : 'contain';
/** First approved tag per canonical identity; Map lookups keep large courses linear. */
export function approvedTagsByKey<T extends { status: string; media_url: string; media_type: string; stream_id?: string | null }>(rows: readonly T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (row.status !== 'approved') continue;
    const key = holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id });
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}
export function galleryShots(posts: readonly FeedPost[], holeTags: readonly HolePhoto[], placeTags: readonly PlaceMedia[]): GalleryShot[] {
  const seen = new Set<string>();
  const holes = approvedTagsByKey(holeTags); const places = approvedTagsByKey(placeTags);
  return posts.flatMap(post => post.mediaItems.flatMap(item => {
    const key = holeMediaKey(item);
    if (seen.has(key) || item.isProcessing) return [];
    seen.add(key);
    const holeTag = holes.get(key);
    const placeTag = places.get(key);
    return [{ id: item.id, item, post, ownerId: post.userId, name: post.displayName, avatar: post.avatarUrl,
      addedAt: holeTag?.added_at ?? placeTag?.added_at ?? post.createdAt, holeTag, placeTag }];
  }));
}
export function filteredGallery(shots: readonly GalleryShot[], filter: GalleryFilter): GalleryShot[] {
  if (filter === 'all') return [...shots];
  if (filter === 'holes') return shots.filter(shot => shot.holeTag).sort((a,b) => (a.holeTag?.hole_no ?? 0) - (b.holeTag?.hole_no ?? 0) || (a.holeTag?.id ?? '').localeCompare(b.holeTag?.id ?? ''));
  return shots.filter(shot => shot.placeTag?.place === filter).sort((a,b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
}
export function galleryFilters(shots: readonly GalleryShot[]) {
  return (['all', 'holes', ...COURSE_PLACES.map(place => place.id)] as GalleryFilter[]).map(filter => ({ filter, count: filteredGallery(shots, filter).length })).filter(row => row.filter === 'all' || row.count > 0);
}
/** Holes group by hole (sticky headers); All and places are one flat grid. */
export function galleryGroups(shots: readonly GalleryShot[], filter: GalleryFilter) {
  const list = filteredGallery(shots, filter);
  if (filter !== 'holes') return list.length ? [{ key: filter, hole: undefined as number | undefined, shots: list }] : [];
  return [...new Set(list.flatMap(shot => shot.holeTag ? [shot.holeTag.hole_no] : []))].sort((a,b) => a-b)
    .map(hole => ({ key: `hole:${hole}`, hole: hole as number | undefined, shots: list.filter(shot => shot.holeTag?.hole_no === hole) }));
}
/** The shots sharing the current shot's hole or place, in its filter's order. */
export function galleryRun(shots: readonly GalleryShot[], shot: GalleryShot | undefined): GalleryShot[] {
  if (!shot) return [];
  if (shot.holeTag) return filteredGallery(shots, 'holes').filter(row => row.holeTag?.hole_no === shot.holeTag?.hole_no);
  if (shot.placeTag) return filteredGallery(shots, shot.placeTag.place as CoursePlace);
  return [];
}
export const shortOrdinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th','st','nd','rd'][n % 10] ?? 'th'}`;
export function galleryAction(shot: GalleryShot, viewerId?: string, admin = false) {
  if (!admin && (!viewerId || shot.ownerId !== viewerId)) return null;
  return shot.holeTag || shot.placeTag ? 'retag' : 'tag';
}
export function galleryPost(shots: readonly GalleryShot[], options: CourseGalleryOptions): FeedPost[] {
  const first = shots[0];
  if (!first) return [];
  return [{ ...first.post, id: `shots:gallery:${options.courseId}:${options.filter}`, userId: '', actorId: '', caption: '',
    courseId: options.courseId, courseName: options.courseName, mediaItems: shots.map(shot => ({ ...shot.item,
      memberShot: { kicker: shot.holeTag ? `The ${holeOrdinal(shot.holeTag.hole_no)}` : '', title: options.courseName,
        credit: '', memberName: shot.name, avatarUrl: shot.avatar || null } })) }];
}