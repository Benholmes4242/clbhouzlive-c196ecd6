/** Assignments live above step branches, but never in drafts or tables. Submit
 * captures a detached job snapshot so navigation cannot drop optional tags.
 * BRIEF_REVIEW_WIZARD_VIDEO_HOLE_TAGS: shots are every image AND video in tray
 * order; videos never supply EXIF (empty metadata), photos read the File only.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { pickPreselectedRound, useMyRoundsAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { composerPhotoMetadata, EMPTY_PHOTO_EXIF, type ComposerHoleJob } from '@/lib/courseMedia/composerHolePhotos';
import type { MediaItem } from '../types';

export function useReviewHoleTags(courseId: string, userId: string | null, items: readonly MediaItem[]) {
  const analysis = useCourseHoleAnalysis(courseId);
  const holes = useMemo(() => analysis.data?.available ? analysis.data.holes.map(h => h.hole_no).sort((a, b) => a - b) : [], [analysis.data]);
  const shots = items.filter(item => item.type === 'image' || item.type === 'video');
  const rounds = useMyRoundsAtCourse(holes.length && shots.length ? courseId : null);
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
    queryKey: ['composer-hole-metadata', courseId, userId, shots.map(p => p.id).join('|')],
    enabled: !!userId && holes.length > 0 && shots.length > 0,
    queryFn: async () => Object.fromEntries(await Promise.all(shots.map(async shot => {
      const exif = shot.type === 'video' ? { ...EMPTY_PHOTO_EXIF } : await composerPhotoMetadata(shot.file, shot.uploadedUrl);
      return [shot.id, { exif }];
    }))),
    staleTime: Infinity,
  });
  const capture = (): ComposerHoleJob | undefined => {
    if (!holes.length) return undefined;
    const live = Object.fromEntries(shots.filter(p => assignments[p.id] != null && holes.includes(assignments[p.id])).map(p => [p.id, assignments[p.id]]));
    return { courseId, assignments: live, knownHoles: [...holes], proofScoreId: chosenRound?.whsScoreId ?? null };
  };
  return { holes, shots, rounds: rounds.data ?? [], chosenRound, chooseRound: setChosenId, assignments,
    assign: (id: string, hole: number) => { if (holes.includes(hole)) setAssignments(prev => ({ ...prev, [id]: hole })); },
    metadata: metadata.data ?? {}, capture };
}