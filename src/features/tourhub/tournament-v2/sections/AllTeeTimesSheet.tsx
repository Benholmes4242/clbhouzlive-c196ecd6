/**
 * AllTeeTimesSheet — full-height sheet listing every group in round-1
 * order. Reuses TeeTimesFirstGroups grammar with no limit.
 */
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';

import type { TeeGroup } from '../data/useTeeTimesAll';
import { TeeTimesFirstGroups } from './TeeTimesFirstGroups';
import { AMBER, FONT, INK, INK_MUTE, SLATE_50 } from '../../_shared/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  groups: TeeGroup[];
  tournamentName: string | null;
  /** Round the sheet is showing — labels the subtitle so the round is never ambiguous. */
  round?: number;
}

export function AllTeeTimesSheet({ open, onClose, groups, tournamentName, round }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={SLATE_50} style={{ height: '75dvh', maxHeight: '75dvh' }}>
      <div style={{ background: SLATE_50, fontFamily: FONT, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '4px 16px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            All Tee Times
          </div>
          {tournamentName && (
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginTop: 4, letterSpacing: '-0.01em' }}>
              {tournamentName}
            </div>
          )}
          {round != null && (
            <div style={{ fontSize: 11, fontWeight: 600, color: INK_MUTE, marginTop: 2 }}>
              Round {round}
            </div>
          )}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <TeeTimesFirstGroups groups={groups} limit={9999} />
        </div>
      </div>
    </BottomSheet>
  );
}
