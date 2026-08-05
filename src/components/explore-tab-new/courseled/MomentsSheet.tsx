import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { MomentTile } from './MomentTile';
import type { Moment } from './hooks/useMomentsOfTheWeek';
import { A, KICKER, SANS } from './tokens';

/**
 * MOMENTS SHEET — the full month of member media, course-labelled (BRIEF,
 * section 4 "See all"). A three-column grid, UNCAPPED: everything qualifying in
 * the 30-day window (only the per-post camera-roll guard applies). The tile is
 * the same component the mosaic renders, so video tiles carry the glyph.
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
  const courseCount = new Set(moments.map((m) => m.courseId)).size;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-moments-title"
      variant="light"
      surfaceColor={A.CANVAS}
      zIndexBase={SHEET_Z_UNDER_VIEWER}
      style={{
        height: '82dvh',
        maxHeight: '82dvh',
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
          {t('discover.momentsOverline', {
            defaultValue: '{{count}} courses',
            count: courseCount,
          })}
        </div>
        <div
          id="courseled-moments-title"
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {t('discover.momentsOfTheMonth', 'Moments of the month')}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
          }}
        >
          {moments.map((m) => (
            <MomentTile
              key={m.key}
              moment={m}
              onPress={onTilePress}
              radius={10}
              initialsSize={18}
              labelSize={9}
              labelInset={6}
              scrimStop="50%"
              style={{ aspectRatio: '1 / 1' }}
            />
          ))}
        </div>
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default MomentsSheet;
