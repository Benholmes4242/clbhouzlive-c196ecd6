import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { MomentsGrid } from './MomentsGrid';
import type { Moment } from './hooks/useMomentsOfTheWeek';
import { A, KICKER, SANS } from './tokens';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * MOMENTS SHEET — the full month of member media, rendered as THE SAME MOSAIC
 * the section renders (BRIEF_MOMENTS_COMMUNITY_GRID). The course-grouped
 * variant was a second geometry for one dataset; it is gone. Tiles are
 * LABELLED here: with no group header, the course name has nowhere else to
 * live, and an unattributed media wall on a course-led page is the defect.
 *
 * STILL UNCAPPED: the sheet's promise is the complete month. No "+n more", no
 * truncation, no expander.
 *
 * Z-ORDER: the shared fullscreen viewer sits at FS_OVERLAY_Z (200). A default
 * BottomSheet base (1400) would paint OVER it, so this sheet is deliberately
 * based below the viewer.
 */

/** Below FS_OVERLAY_Z (200) so the read-only viewer opens ON TOP of the sheet. */
const SHEET_Z_UNDER_VIEWER = 150;

interface Props {
  open: boolean;
  onClose: () => void;
  moments: Moment[];
  onTilePress: (m: Moment) => void;
}

export function MomentsSheet({ open, onClose, moments, onTilePress }: Props) {
  const { t } = useTranslation('courses');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-moments-title"
      variant="light"
      surfaceColor={A.CANVAS}
      zIndexBase={SHEET_Z_UNDER_VIEWER}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
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
        <div style={{ ...KICKER, color: A.DIM, marginBottom: 5 }}>
          {t('discover.momentsCount', {
            defaultValue: '{{count}} moments',
            count: moments.length,
          })}
        </div>
        <div
          id="courseled-moments-title"
          style={{
            ...TITLE_METRICS,
            color: A.INK,
          }}
        >
          {/* SAME KEY as the section eyebrow: the two must never be able to
              say different things. */}
          {t('discover.momentsFromCommunity', 'From the community')}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <MomentsGrid
          moments={moments}
          gap={2}
          tall={220}
          radius={8}
          onTilePress={onTilePress}
          autoplayGroup="moments-sheet"
        />
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default MomentsSheet;
