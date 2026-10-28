/** Viewer single-shot adapter. Existing member mutations and admin RPCs retain
 * authority; only a successful write changes the live gallery snapshot. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useHolePhotoTagging } from './hooks/useHolePhotoTagging';
import { useCoursePlaceMedia, type PlaceMedia } from './hooks/useCoursePlaceMedia';
import { tagAdminHole } from './AdminHoleTagging';
import { ShotTagCard } from './ShotTagCard';
import type { GalleryShot } from '@/lib/courseMedia/courseGallery';
import type { CoursePlace } from '@/lib/courseMedia/places';
import type { HolePhoto, OwnMediaSource } from '@/lib/courseMedia/holePhotoData';
import { holeMediaKey, holeSourceUrl } from '@/lib/courseMedia/holePhotoData';
import { holePhotoErrorMessage } from '@/lib/courseMedia/holePhotoError';

export function CourseGalleryTagger({ courseId, shot, holes, onClose, onSaved }: {
  courseId: string; shot: GalleryShot; holes: readonly number[]; onClose: () => void;
  onSaved: (holeTag?: HolePhoto, placeTag?: PlaceMedia) => void;
}) {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const admin = useIsAdmin();
  const cache = useQueryClient();
  const member = useHolePhotoTagging(courseId, user?.id, holes);
  const places = useCoursePlaceMedia(courseId, user?.id);
  const [hole, setHole] = useState<number | null>(shot.holeTag?.hole_no ?? null);
  const [place, setPlace] = useState<CoursePlace | null>((shot.placeTag?.place as CoursePlace | undefined) ?? null);
  const [tag, setTag] = useState<{ hole?: HolePhoto; place?: PlaceMedia }>({ hole: shot.holeTag, place: shot.placeTag });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owned = !!user && shot.ownerId === user.id;
  const source: OwnMediaSource = { url: holeSourceUrl(shot.item), mediaType: shot.item.type, streamId: shot.item.streamId ?? null,
    posterUrl: shot.item.thumbnailUrl ?? null, createdAt: shot.addedAt, width: shot.item.width, height: shot.item.height, durationSeconds: shot.item.duration ?? null };
  const refresh = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId] }),
      cache.invalidateQueries({ queryKey: ['course-place-media', courseId] }),
      cache.invalidateQueries({ queryKey: ['admin-untagged-course-media', courseId] }),
      cache.invalidateQueries({ queryKey: ['course-gallery', courseId] }),
      cache.invalidateQueries({ queryKey: ['course-media-feed', courseId] }),
      cache.invalidateQueries({ queryKey: ['hole-media', courseId] }),
      cache.invalidateQueries({ predicate: q => q.queryKey.includes('get_latest_hole_media') }),
    ]);
  };
  const remove = async () => {
    if (!owned && !admin) return;
    setPending(true); setError(null);
    try {
      if (tag.hole) {
        if (admin && !owned) { const result = await supabase.rpc('admin_untag_hole_media', { p_tag_id: tag.hole.id }); if (result.error) throw result.error; }
        else await member.remove.mutateAsync({ row: tag.hole });
      }
      if (tag.place) {
        if (admin && !owned) { const result = await supabase.rpc('admin_untag_place_media', { p_tag_id: tag.place.id }); if (result.error) throw result.error; }
        else await places.remove.mutateAsync({ row: tag.place });
      }
      setTag({}); setHole(null); setPlace(null); onSaved(); await refresh();
    } catch (failure) { setError(holePhotoErrorMessage(failure, t('media.gallery.saveError', { defaultValue: 'The tag could not be saved. Nothing was changed.' }))); }
    finally { setPending(false); }
  };
  const save = async () => {
    if ((!owned && !admin) || (hole == null && place == null) || tag.hole || tag.place) return;
    setPending(true); setError(null);
    try {
      let holeTag: HolePhoto | undefined; let placeTag: PlaceMedia | undefined;
      if (owned) {
        if (hole != null) holeTag = await member.submit.mutateAsync({ post: { ...shot.post, userId: shot.ownerId, actorType: 'personal', mediaItems: [shot.item] }, hole });
        else if (place) placeTag = await places.submit.mutateAsync({ source, place });
      } else {
        // Tagged gallery IDs are contribution IDs, not source-media IDs. The
        // existing admin queue resolves the canonical source after removal.
        const { data: queue, error: queueError } = await supabase.rpc('admin_get_untagged_course_media', { p_course_id: courseId });
        if (queueError) throw queueError;
        const row = queue?.find(row => holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }) === holeMediaKey(shot.item));
        if (!row) throw new Error('This shot cannot be tagged.');
        if (hole != null) holeTag = await tagAdminHole(courseId, row.media_id, hole);
        else if (place) {
          const { data: id, error } = await supabase.rpc('admin_tag_place_media', { p_course_id: courseId, p_media_id: row.media_id, p_place: place });
          if (error) throw error;
          if (!id) throw new Error('The tag was not saved.');
          const result = await supabase.from('course_place_media').select('*').eq('id', id).single();
          if (result.error) throw result.error;
          placeTag = result.data;
        }
      }
      onSaved(holeTag, placeTag); onClose(); await refresh();
    } catch (failure) { setError(holePhotoErrorMessage(failure, t('media.gallery.saveError', { defaultValue: 'The tag could not be saved. Nothing was changed.' }))); }
    finally { setPending(false); }
  };
  return <ShotTagCard gallerySingle shot={{ ...source, ownerName: shot.name }} holes={holes} hole={hole} place={place}
    onHole={next => { setHole(current => current === next ? null : next); setPlace(null); }}
    onPlace={next => { setPlace(current => current === next ? null : next); setHole(null); }}
    pending={pending} locked={!!(tag.hole || tag.place)} canSubmit={(hole != null || place != null) && !tag.hole && !tag.place}
    onSubmit={() => void save()} onSkip={onClose} onClose={onClose}
    remove={tag.hole || tag.place ? { onClick: () => void remove() } : undefined}>
    {error && <p role="alert">{error}</p>}
  </ShotTagCard>;
}