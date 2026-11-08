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
import { PLACE_LABELS } from './ShotTagChoices';
import { ordinal } from '@/lib/text/numbers';
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
  const [tag] = useState<{ hole?: HolePhoto; place?: PlaceMedia }>({ hole: shot.holeTag, place: shot.placeTag });
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
  const currentHole = tag.hole?.hole_no ?? null;
  const currentPlace = (tag.place?.place as CoursePlace | undefined) ?? null;
  const hasTag = !!(tag.hole || tag.place);
  const unchanged = hole === currentHole && place === currentPlace;
  const failMessage = () => t('media.gallery.saveError', { defaultValue: 'The tag could not be saved. Nothing was changed.' });
  /** Admin add path: the queue resolves the canonical source after removal. */
  const adminAdd = async (): Promise<{ holeTag?: HolePhoto; placeTag?: PlaceMedia }> => {
    const { data: queue, error: queueError } = await supabase.rpc('admin_get_untagged_course_media', { p_course_id: courseId });
    if (queueError) throw queueError;
    const row = queue?.find(row => holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }) === holeMediaKey(shot.item));
    if (!row) throw new Error('This shot cannot be tagged.');
    if (hole != null) return { holeTag: await tagAdminHole(courseId, row.media_id, hole) };
    if (!place) return {};
    const { data: id, error } = await supabase.rpc('admin_tag_place_media', { p_course_id: courseId, p_media_id: row.media_id, p_place: place });
    if (error) throw error;
    if (!id) throw new Error('The tag was not saved.');
    const result = await supabase.from('course_place_media').select('*').eq('id', id).single();
    if (result.error) throw result.error;
    return { placeTag: result.data };
  };
  const ownAdd = async (): Promise<{ holeTag?: HolePhoto; placeTag?: PlaceMedia }> => {
    if (hole != null) return { holeTag: await member.submit.mutateAsync({ post: { ...shot.post, userId: shot.ownerId, actorType: 'personal', mediaItems: [shot.item] }, hole }) };
    if (place) return { placeTag: await places.submit.mutateAsync({ source, place }) };
    return {};
  };
  const ownRemove = async () => {
    if (tag.hole) await member.remove.mutateAsync({ row: tag.hole });
    if (tag.place) await places.remove.mutateAsync({ row: tag.place });
  };
  /** Restores the old tag with the same submit after a failed add. */
  const ownRestore = async () => {
    if (currentHole != null) await member.submit.mutateAsync({ post: { ...shot.post, userId: shot.ownerId, actorType: 'personal', mediaItems: [shot.item] }, hole: currentHole });
    else if (currentPlace) await places.submit.mutateAsync({ source, place: currentPlace });
  };
  const save = async () => {
    if ((!owned && !admin) || pending) return;
    if (hasTag ? unchanged : (hole == null && place == null)) return;
    setPending(true); setError(null);
    try {
      let added: { holeTag?: HolePhoto; placeTag?: PlaceMedia } = {};
      if (owned) {
        const postMediaId = tag.hole?.source_post_media_id ?? null;
        if (!hasTag) added = await ownAdd();
        else if (postMediaId) {
          // Post-sourced hole: the post owns the hole; the server moves or removes the row.
          const { error } = await supabase.from('post_media').update({ hole_no: hole } as never).eq('id', postMediaId);
          if (error) throw error;
          if (tag.place) await places.remove.mutateAsync({ row: tag.place });
          if (place) added = { placeTag: await places.submit.mutateAsync({ source, place }) };
        } else if (tag.hole && !tag.place && hole != null) {
          await member.move.mutateAsync({ row: tag.hole, hole });
        } else {
          await ownRemove();
          if (hole != null || place != null) {
            try { added = await ownAdd(); }
            catch (failure) { await ownRestore().catch(() => {}); throw failure; }
          }
        }
      } else {
        if (tag.hole) { const result = await supabase.rpc('admin_untag_hole_media', { p_tag_id: tag.hole.id }); if (result.error) throw result.error; }
        if (tag.place) { const result = await supabase.rpc('admin_untag_place_media', { p_tag_id: tag.place.id }); if (result.error) throw result.error; }
        if (hole != null || place != null) added = await adminAdd();
      }
      onSaved(added.holeTag, added.placeTag); onClose(); await refresh();
    } catch (failure) { setError(holePhotoErrorMessage(failure, failMessage())); }
    finally { setPending(false); }
  };
  const primaryLabel = !hasTag ? undefined
    : unchanged ? (currentHole != null
      ? t('media.v3.taggedHole', { ordinal: ordinal(currentHole), defaultValue: `Tagged to the ${ordinal(currentHole)}` })
      : t('media.v3.taggedPlace', { label: PLACE_LABELS[currentPlace!], defaultValue: `Tagged as ${PLACE_LABELS[currentPlace!]}` }))
    : hole != null ? t('media.v3.moveHole', { ordinal: ordinal(hole), defaultValue: `Move to the ${ordinal(hole)}` })
    : place ? t('media.v3.movePlace', { label: PLACE_LABELS[place], defaultValue: `Move to ${PLACE_LABELS[place]}` })
    : t('media.v3.remove', { defaultValue: 'Remove tag' });
  const canSubmit = hasTag ? !unchanged : (hole != null || place != null);
  return <ShotTagCard gallerySingle shot={{ ...source, ownerName: shot.name }} holes={holes} hole={hole} place={place}
    onHole={next => { setHole(current => current === next ? null : next); setPlace(null); }}
    onPlace={next => { setPlace(current => current === next ? null : next); setHole(null); }}
    pending={pending} canSubmit={canSubmit} primaryLabel={primaryLabel}
    onSubmit={() => void save()} onSkip={onClose} onClose={onClose}>
    {error && <p role="alert">{error}</p>}
  </ShotTagCard>;
}