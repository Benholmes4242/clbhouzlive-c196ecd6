import React from 'react';
import { Crown, type LucideIcon } from 'lucide-react';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import type { WindowToggleVariant } from '../CourseLegendsSection';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ScopeSegment } from '@/components/shared/ScopeSegment';


export interface CabinetSlot {
  key: LegendCategory;
  short: string;
  icon: LucideIcon;
  held: boolean;
}

interface CrownCabinetProps {
  slots: CabinetSlot[];
  heldCount: number;
  window: LegendWindow;
  onWindowChange: (w: LegendWindow) => void;
  toggleVariant?: WindowToggleVariant;
}

const HELD_LABEL = 'var(--hcp-gold-text)';
const INK = 'var(--hcp-t-100)';

export const CrownCabinet: React.FC<CrownCabinetProps> = ({
  slots,
  heldCount,
  window,
  onWindowChange,
  toggleVariant = 'dark',
}) => {
  const cols = slots.length || 6;
  const orderedSlots = [...slots].sort((a, b) => Number(b.held) - Number(a.held));

  return (
    <div
      style={{
        margin: '12px 16px',
        background: 'var(--hcp-bg-1)',
        border: '0.5px solid var(--hcp-line)',
        borderRadius: 16,
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
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
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
          marginRight: -16,
          paddingRight: 16,
          scrollbarWidth: 'none',
        }}
      >
        {orderedSlots.map((slot) => {
          const SlotIcon = slot.icon;
          return (
            <div
              key={slot.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                width: 64,
                scrollSnapAlign: 'start',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: slot.held
                    ? 'linear-gradient(135deg, #FBBC2E, #E07F0E)'
                    : 'var(--hcp-tint-3)',
                  border: slot.held ? 'none' : '1.5px dashed var(--hcp-dash)',
                  boxShadow: slot.held ? '0 2px 8px rgba(247,147,30,0.35)' : 'none',
                }}
              >
                {slot.held ? (
                  <Crown size={18} strokeWidth={2.4} color="#FFFFFF" fill="rgba(255,255,255,0.35)" />
                ) : (
                  <SlotIcon size={15} color="var(--hcp-t-30)" strokeWidth={2.2} />
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: slot.held ? HELD_LABEL : 'var(--hcp-t-40)',
                  textAlign: 'center',
                  lineHeight: 1.15,
                }}
              >
                {slot.short}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
        <ScopeSegment<LegendWindow>
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
  );
};

export default CrownCabinet;
