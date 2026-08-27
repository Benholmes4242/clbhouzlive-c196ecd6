import { KICKER } from '@/features/courses/components/holes/analytical/tokens';
import React from 'react';
import { Crown } from 'lucide-react';

import type { LegendWindow } from '@/lib/gam/types';
import { ScopeSegment } from '@/components/shared/ScopeSegment';

import { CrownCabinet, type CabinetSlot } from './CrownCabinet';
import type { WindowToggleVariant } from '../types';

interface Props {
  userId: string | undefined;
  courseId: string;
  theme?: 'light' | 'dark';
  slots: CabinetSlot[];
  heldCount: number;
  window: LegendWindow;
  onWindowChange: (w: LegendWindow) => void;
  toggleVariant?: WindowToggleVariant;
}

/**
 * One card holding the viewer's crown cabinet at this course, plus the
 * All time / 90 days window control. The cabinet leads and takes the full
 * row width. With no cabinet slots there is nothing to scope, so the card
 * does not render at all.
 */
export const ChampionsYouCard: React.FC<Props> = ({
  slots,

  heldCount,
  window,
  onWindowChange,
  toggleVariant = 'dark',
}) => {
  const hasCabinet = slots.length > 0;
  if (!hasCabinet) return null;

  return (
    <div
      style={{
        margin: '12px 16px',
        background: 'var(--hcp-bg-1)',
        border: '0.5px solid var(--hcp-line)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px' }}>
        <div style={{ width: '100%', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={KICKER}>Your crown cabinet</span>
            </div>
            <span
              style={{
                ...KICKER,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontVariantNumeric: 'tabular-nums lining-nums',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              <Crown size={11} strokeWidth={2.6} />
              {heldCount} / {slots.length}
            </span>
          </div>
          <CrownCabinet
            slots={slots}
            heldCount={heldCount}
            window={window}
            onWindowChange={onWindowChange}
            toggleVariant={toggleVariant}
            bare
          />
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
          <ScopeSegment
              tone="dark"
            value={window}
            onChange={onWindowChange}
            ariaLabel="Time window"
            options={[
              { value: 'all_time', label: 'All time' },
              { value: '90d', label: '90 days' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ChampionsYouCard;
