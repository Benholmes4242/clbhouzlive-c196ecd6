import React from 'react';
import { Crown } from 'lucide-react';

import type { LegendWindow } from '@/lib/gam/types';
import { ScopeSegment } from '@/components/shared/ScopeSegment';
import { SectionHeader } from '@/components/ui/SectionHeader';

import { YouAtThisClubStrip } from './YouAtThisClubStrip';
import { CrownCabinet, type CabinetSlot } from './CrownCabinet';
import { CourseRivalryLine } from './CourseRivalryLine';
import type { WindowToggleVariant } from '../CourseLegendsSection';

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
 * One card grouping the viewer's personal context at this course:
 *   - top region: "you at this club" stats (left) + crown cabinet squircles (right)
 *   - footer region: the rivalry line, on a faint tint behind a hairline
 * Each region is independently optional, so an absent rival or an empty cabinet
 * never blanks or collapses the card.
 */
export const ChampionsYouCard: React.FC<Props> = ({
  userId,
  courseId,
  theme = 'dark',
  slots,
  heldCount,
  window,
  onWindowChange,
  toggleVariant = 'dark',
}) => {
  const hasCabinet = slots.length > 0;
  if (!userId && !hasCabinet) return null;

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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          {userId ? (
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <YouAtThisClubStrip
                userId={userId}
                courseId={courseId}
                theme={theme}
                heldCountOverride={heldCount}
                bare
              />
            </div>
          ) : null}

          {hasCabinet ? (
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
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
                  <SectionHeader role="section" kicker="YOUR CROWN CABINET" />
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--hcp-gold-text)',
                    background: 'rgba(251,188,46,0.16)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontVariantNumeric: 'tabular-nums',
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
          ) : null}
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
          <ScopeSegment
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

      <CourseRivalryLine userId={userId} courseId={courseId} theme={theme} bare />
    </div>
  );
};

export default ChampionsYouCard;
