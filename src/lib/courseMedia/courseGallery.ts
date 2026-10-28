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
export function galleryShots(posts: readonly FeedPost[], holeTags: readonly HolePhoto[], placeTags: readonly PlaceMedia[]): GalleryShot[] {
  const seen = new Set<string>();
  return posts.flatMap(post => post.mediaItems.flatMap(item => {
    const key = holeMediaKey(item);
    if (seen.has(key) || item.isProcessing) return [];
    seen.add(key);
    const holeTag = holeTags.find(row => row.status === 'approved' && holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }) === key);
    const placeTag = placeTags.find(row => row.status === 'approved' && holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }) === key);
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
export function galleryGroups(shots: readonly GalleryShot[], filter: GalleryFilter) {
  const list = filteredGallery(shots, filter);
  const groups: { key: string; hole?: number; place?: CoursePlace; shots: GalleryShot[] }[] = [];
  if (filter === 'all' || filter === 'holes') {
    for (const hole of [...new Set(list.flatMap(shot => shot.holeTag ? [shot.holeTag.hole_no] : []))].sort((a,b) => a-b)) {
      groups.push({ key: `hole:${hole}`, hole, shots: list.filter(shot => shot.holeTag?.hole_no === hole) });
    }
  }
  if (filter !== 'holes') for (const place of COURSE_PLACES) {
    const group = list.filter(shot => !shot.holeTag && shot.placeTag?.place === place.id);
    if (group.length) groups.push({ key: place.id, place: place.id, shots: group });
  }
  const untagged = list.filter(shot => !shot.holeTag && !shot.placeTag);
  if (filter === 'all' && untagged.length) groups.push({ key: 'untagged', shots: untagged });
  return groups;
}
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