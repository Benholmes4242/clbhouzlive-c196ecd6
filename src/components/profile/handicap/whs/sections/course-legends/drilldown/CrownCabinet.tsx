import React from 'react';
import { Crown, type LucideIcon } from 'lucide-react';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import { WindowToggle } from '../CourseLegendsSection';

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
}

const AMBER = '#F7931E';
const HELD_LABEL = 'var(--hcp-gold-text)';
const INK = 'var(--hcp-t-100)';

export const CrownCabinet: React.FC<CrownCabinetProps> = ({
  slots,
  heldCount,
  window,
  onWindowChange,
}) => {
  const cols = slots.length || 6;

  return (
    <div
      style={{
        margin: '12px 16px',
        background: 'var(--hcp-bg-1)',
        border: '0.5px solid var(--hcp-line)',
        borderRadius: 16,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: AMBER,
          }}
        >
          Your crown cabinet
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {heldCount} / {slots.length}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {slots.map((slot) => {
          const SlotIcon = slot.icon;
          return (
            <div key={slot.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
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
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: slot.held ? HELD_LABEL : 'var(--hcp-t-40)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {slot.short}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-start' }}>
        <WindowToggle window={window} setWindow={onWindowChange} />
      </div>
    </div>
  );
};

export default CrownCabinet;
