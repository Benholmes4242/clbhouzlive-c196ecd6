import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { HonoursBoard, GOLD_INK, HONOURS_WASH } from './HonoursBoard';
import { A, SANS } from './tokens';

/**
 * THE HONOURS BOARD, ALL TIME — the complete legendary set in the same row
 * grammar as the page panel, on the same washed gold background. Rows stay
 * tappable; the scorecard sheet stacks above (news-sheet precedent).
 */

interface Props {
  open: boolean;
  onClose: () => void;
  events: WireEvent[];
  onRowPress?: (event: WireEvent) => void;
}

export function HonoursBoardSheet({ open, onClose, events, onRowPress }: Props) {
  const { t } = useTranslation('courses');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-honours-title"
      variant="light"
      surfaceColor={HONOURS_WASH}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: HONOURS_WASH,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: HONOURS_WASH,
          borderBottom: '1px solid rgba(216,169,60,0.22)',
        }}
      >
        <div
          id="courseled-honours-title"
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {t('discover.honoursTitleSentence', 'The honours board')}
        </div>
        <div style={{ fontSize: 10.5, color: GOLD_INK, marginTop: 5, fontWeight: 600 }}>
          {t('discover.honoursSheetCaption', '{{count}} entries · all time', {
            count: events.length,
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <HonoursBoard
          events={events}
          limit={events.length}
          showHeader={false}
          onRowPress={onRowPress}
        />
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default HonoursBoardSheet;
