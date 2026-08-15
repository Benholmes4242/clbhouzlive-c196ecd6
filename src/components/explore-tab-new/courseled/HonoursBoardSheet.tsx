import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import type { WireEvent } from '../hooks/useDiscoverWire';
import {
  HonoursBoard,
  HonoursModeToggle,
  useHonoursHeadline,
  type HonoursMode,
} from './HonoursBoard';
import { GOLD_HAIR, HONOURS_WASH, ACH_GOLD_INK } from './honoursTokens';
import { A, LABEL, SANS } from './tokens';

/**
 * THE HONOURS BOARD, ALL TIME — the same PLAQUE as the Discover rail, wrapped
 * two across instead of scrolled (BRIEF_HONOURS_BOARD_PLAQUE_RAIL §7), on the
 * same washed gold background. RECENT groups the plaques under a year heading;
 * LEADERS is the leader plaques wrapped with no year grouping, because a leader
 * is not a year.
 *
 * The sheet carries the toggle in its OWN header and drives the board as a
 * controlled component — the mode does not persist across mounts.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  events: WireEvent[];
  onRowPress?: (event: WireEvent) => void;
}

export function HonoursBoardSheet({ open, onClose, events, onRowPress }: Props) {
  const { t } = useTranslation('courses');
  const [mode, setMode] = useState<HonoursMode>('recent');
  const headline = useHonoursHeadline(events);

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
          padding: '10px 14px 12px',
          background: HONOURS_WASH,
          borderBottom: `1px solid ${GOLD_HAIR}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...LABEL, fontSize: 9.5, letterSpacing: '0.16em', color: ACH_GOLD_INK }}>
            {t('discover.honoursTitle', 'The honours board')}
          </div>
          <span style={{ marginLeft: 'auto' }}>
            <HonoursModeToggle mode={mode} onChange={setMode} />
          </span>
        </div>
        <div
          id="courseled-honours-title"
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: A.INK,
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {headline}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: A.MUTE, marginTop: 3 }}>
          {mode === 'recent'
            ? t('discover.honours.subRecent', 'In clbhouz history')
            : t('discover.honours.subLeaders', {
                count: new Set(events.map((e) => e.userId ?? e.id)).size,
                defaultValue: '{{count}} golfers',
              })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <HonoursBoard
          events={events}
          layout="grid"
          showHeader={false}
          mode={mode}
          onModeChange={setMode}
          onRowPress={onRowPress}
        />
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default HonoursBoardSheet;
