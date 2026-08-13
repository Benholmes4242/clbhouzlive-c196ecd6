import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { HonoursBoard, GOLD_INK, HONOURS_WASH } from './HonoursBoard';
import { A, LABEL, SANS } from './tokens';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

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
        height: 'auto',
        maxHeight: '85dvh',
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
          style={{
            ...LABEL,
            color: GOLD_INK,
            marginBottom: 5,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {t('discover.honoursOnTheBoard', '{{count}} on the board', {
            count: events.length,
          })}
        </div>
        <div
          id="courseled-honours-title"
          style={{
            ...TITLE_METRICS,
            color: A.INK,
          }}
        >
          {t('discover.honoursTitleSentence', 'The honours board')}
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
