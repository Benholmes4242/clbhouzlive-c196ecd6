/**
 * Rail card → sheet (BRIEF_WHATS_BEEN_PLAYED_V4 §4, signed-off v4 mock). The
 * canonical BottomSheet (as OurRecordSheet uses it) on its 'panel' surface
 * holding the SAME PlayedTile with the same data (usePlayedTile for that
 * course). Best lately/faces/Explore close the sheet first and navigate once
 * the sheet's history entry has unwound (afterSheetHistorySettled); photos open
 * the viewer above the sheet. Seen is written by WhoPlayingSection's single
 * seen owner, which receives this sheet's course.
 */
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { afterSheetHistorySettled } from '@/components/ui/sheetHistory';
import { PlayedTile } from './PlayedTile';
import { usePlayedTile } from './usePlayedTile';
import type { PlayedCourse } from './usePlayedRounds';
import type { CourseGroup } from './WhoPlayingSection';

type FacesMap = ReadonlyMap<string, { displayName: string | null; username: string | null; photoUrl: string | null }>;

export const SHEET_TILE_GAP = 8;

export function PlayedTileSheet({ group, course, userId, faces, onClose }: {
  group: CourseGroup; course: PlayedCourse; userId: string | undefined; faces: FacesMap; onClose: () => void;
}) {
  const navigate = useNavigate();
  const tile = usePlayedTile(course.id, userId);
  const go = (to: string) => { onClose(); afterSheetHistorySettled(() => navigate(to)); };
  return (
    <BottomSheet open onClose={onClose} surface="panel" scrollBody topRadius={22} maxHeight="90vh"
      grabberColor="rgba(255,255,255,0.22)" grabberPadding="8px 0 0"
      style={{ paddingBottom: 'calc(30px + env(safe-area-inset-bottom, 0px))' }}>
      <div data-played-sheet={course.id}>
        <PlayedTile group={group} course={course} tile={tile} faces={faces} onNavigate={go} inSheet topGap={SHEET_TILE_GAP} />
      </div>
    </BottomSheet>
  );
}
