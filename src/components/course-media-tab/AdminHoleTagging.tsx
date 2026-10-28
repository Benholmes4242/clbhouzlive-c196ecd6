/** Admin-only batch adapter. The server owns contributor attribution,
 * tagged_by, ready/source checks and refusal; never a client insert, member
 * notification or change to member tagging/Move/Remove. Refresh every viewer
 * of course tags, the admin queue, Latest holes and the chosen hole read. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminUntaggedCourseMedia, type AdminUntaggedMedia } from '@/hooks/useAdminUntaggedCourseMedia';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';
import { capitalPhotoCount, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { orderedBatch } from '@/lib/courseMedia/holePhotoBatch';
import { Button } from '@/components/ui/button';
import type { CoursePlace } from '@/lib/courseMedia/places';
import type { PlaceMedia } from './hooks/useCoursePlaceMedia';
import { HolePhotoBatchPath } from './HolePhotoFastPaths';

export function adminBatchPhotos(rows: readonly AdminUntaggedMedia[]) {
  return orderedBatch(rows.map(row => ({
    mediaId: row.media_id, ownerName: row.owner_name, url: row.media_url, createdAt: row.created_at,
    exif: { capturedAt: null, captureDay: null, latitude: null, longitude: null },
    mediaType: row.media_type === 'video' ? 'video' as const : 'image' as const,
    streamId: row.stream_id, posterUrl: row.poster_url, durationSeconds: row.duration_seconds,
  })));
}

export async function tagAdminHole(courseId: string, mediaId: string, hole: number): Promise<HolePhoto> {
  const { data: id, error } = await supabase.rpc('admin_tag_hole_media', { p_course_id: courseId, p_media_id: mediaId, p_hole_no: hole });
  if (error) throw error;
  if (!id) throw new Error('The tag was not saved.');
  const { data: row, error: readError } = await supabase.from('course_hole_media').select('*').eq('id', id).single();
  if (readError) throw readError;
  if (!row) throw new Error('The saved tag could not be read.');
  return row;
}

export function AdminHoleTagging({ courseId, knownHoles }: { courseId: string; knownHoles: readonly number[] | null }) {
  const isAdmin = useIsAdmin();
  const query = useAdminUntaggedCourseMedia(courseId, isAdmin);
  const cache = useQueryClient();
  const [batch, setBatch] = useState<ReturnType<typeof adminBatchPhotos> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const rows = query.data ?? [];
  const refresh = async (hole?: number) => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId] }),
      cache.invalidateQueries({ queryKey: ['course-place-media', courseId] }),
      cache.invalidateQueries({ queryKey: ['admin-untagged-course-media', courseId] }),
      cache.invalidateQueries({ predicate: q => q.queryKey.includes('get_latest_hole_media') }),
      ...(hole == null ? [] : [cache.invalidateQueries({ queryKey: ['hole-media', courseId, hole] })]),
    ]);
  };
  const tagPlace = async (url: string, place: CoursePlace): Promise<PlaceMedia> => {
    const photo = batch?.find(p => p.url === url);
    if (!photo || !isAdmin) throw new Error('This shot cannot be tagged.');
    const { data: id, error } = await supabase.rpc('admin_tag_place_media', { p_course_id: courseId, p_media_id: photo.mediaId, p_place: place });
    if (error) throw error;
    if (!id) throw new Error('The tag was not saved.');
    const { data: row, error: readError } = await supabase.from('course_place_media').select('*').eq('id', id).single();
    await refresh();
    if (readError) throw readError;
    if (!row) throw new Error('The saved tag could not be read.');
    return row;
  };
  const untagPlace = async (row: PlaceMedia) => {
    const { error } = await supabase.rpc('admin_untag_place_media', { p_tag_id: row.id });
    if (error) throw error;
    await refresh();
  };
  const tag = async (url: string, hole: number) => {
    const photo = batch?.find(p => p.url === url);
    if (!photo || !isAdmin || !knownHoles?.includes(hole)) throw new Error('This shot cannot be tagged.');
    try {
      const row = await tagAdminHole(courseId, photo.mediaId, hole);
      await refresh(hole);
      return row;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') setNotice('That shot is already tagged.');
      throw error;
    }
  };
  /** BRIEF_HOLE_TAG_BATCH_REMOVE_TAG: the server owns the delete; the client
   * only calls the admin RPC and refreshes the same viewers as a tag. */
  const untag = async (row: HolePhoto) => {
    const { error } = await supabase.rpc('admin_untag_hole_media', { p_tag_id: row.id });
    if (error) throw error;
    await refresh(row.hole_no);
  };
  if (!isAdmin) return null;
  return <>
    {query.isSuccess && rows.length > 0 && <section className="px-5 pt-5">
      <p style={VERDICT_KICKER}>Admin</p>
      <div className="flex items-center gap-3">
        <h2 style={{ ...TAB_TITLE, flex: '1 1 auto', minWidth: 0 }}>{capitalPhotoCount(rows.length)} untagged {rows.length === 1 ? 'shot' : 'shots'} here</h2>
        <Button variant="ghost" onClick={() => { setNotice(null); setBatch(adminBatchPhotos(rows)); }} style={{ flexShrink: 0, minHeight: 44, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span style={{ background: A.INK, color: INK_ON_LIGHT, borderRadius: 999, fontSize: 13, fontWeight: 700, padding: '8px 16px', whiteSpace: 'nowrap' }}>Tag them</span>
        </Button>
      </div>
    </section>}
    {notice && !batch && <p role="alert" className="px-5 text-[12.5px]" style={{ color: A.MUTE }}>{notice}</p>}
    {batch && <HolePhotoBatchPath adminMode photos={batch} knownHoles={knownHoles ?? []} onTagPlace={tagPlace} onRemovePlace={untagPlace} onTag={tag} onRemove={untag} onClose={() => setBatch(null)} />}
  </>;
}