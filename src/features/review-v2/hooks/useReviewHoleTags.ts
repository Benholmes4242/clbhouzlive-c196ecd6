/** Assignments live above step branches, but never in drafts or tables. Submit
 * captures a detached job snapshot so navigation cannot drop optional tags.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { pickPreselectedRound, useMyRoundsAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { composerPhotoMetadata, type ComposerHoleJob } from '@/lib/courseMedia/composerHolePhotos';
import type { MediaItem } from '../types';

export function useReviewHoleTags(courseId: string, userId: string | null, items: readonly MediaItem[]) {
  const analysis = useCourseHoleAnalysis(courseId);
  const holes = useMemo(() => analysis.data?.available ? analysis.data.holes.map(h => h.hole_no).sort((a, b) => a - b) : [], [analysis.data]);
  const photos = items.filter(item => item.type === 'image');
  const rounds = useMyRoundsAtCourse(holes.length && photos.length ? courseId : null);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [chosenId, setChosenId] = useState<string | null>(null);
  const initialised = useRef(false);
  useEffect(() => {
    if (!rounds.isSuccess || initialised.current) return;
    initialised.current = true;
    setChosenId(pickPreselectedRound(rounds.data ?? [])?.whsScoreId ?? null);
  }, [rounds.isSuccess, rounds.data]);
  const chosenRound = (rounds.data ?? []).find(round => round.whsScoreId === chosenId) ?? null;
  const metadata = useQuery({
    queryKey: ['composer-hole-metadata', courseId, userId, photos.map(p => p.id).join('|')],
    enabled: !!userId && holes.length > 0 && photos.length > 0,
    queryFn: async () => Object.fromEntries(await Promise.all(photos.map(async photo => {
      const exif = await composerPhotoMetadata(photo.file, photo.uploadedUrl);
      return [photo.id, { exif }];
    }))),
    staleTime: Infinity,
  });
  const capture = (): ComposerHoleJob | undefined => {
    if (!holes.length) return undefined;
    const live = Object.fromEntries(photos.filter(p => assignments[p.id] != null && holes.includes(assignments[p.id])).map(p => [p.id, assignments[p.id]]));
    return { courseId, assignments: live, knownHoles: [...holes], proofScoreId: chosenRound?.whsScoreId ?? null };
  };
  return { holes, photos, rounds: rounds.data ?? [], chosenRound, chooseRound: setChosenId, assignments,
    assign: (id: string, hole: number) => { if (holes.includes(hole)) setAssignments(prev => ({ ...prev, [id]: hole })); },
    metadata: metadata.data ?? {}, capture };
}