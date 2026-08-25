import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { MostPlayedLeaderboard } from './MostPlayedLeaderboard';
import type { MostPlayedPlayer, MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, LABEL, SANS } from './tokens';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * MOST PLAYED SHEET — the full frequency table (BRIEF, section 5 "See all").
 * Same rows as the panel, uncapped, coming straight back.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  rows: MostPlayedRow[];
  onRowPress: (row: MostPlayedRow) => void;
  /** Passed straight through: a board row opens that round's scorecard. */
  onPlayerPress?: (player: MostPlayedPlayer) => void;
}

export function MostPlayedSheet({ open, onClose, rows, onRowPress, onPlayerPress }: Props) {
  const { t } = useTranslation('courses');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-mostplayed-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={{ ...LABEL, color: A.DIM, marginBottom: 5 }}>
          {t('discover.mostPlayedSheetCaption', { count: rows.length })}
        </div>
        <div
          id="courseled-mostplayed-title"
          style={{
            ...TITLE_METRICS,
            color: A.INK,
          }}
        >
          {t('discover.mostPlayed', 'Courses played in the last 14 days')}
        </div>
      </div>


      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <MostPlayedLeaderboard
          rows={rows}
          limit={rows.length}
          onRowPress={onRowPress}
          onPlayerPress={onPlayerPress}
          showEyebrow={false}
        />
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default MostPlayedSheet;
