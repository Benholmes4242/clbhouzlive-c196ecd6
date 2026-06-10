import React from 'react';
import { Crown, type LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';

export interface CabinetSlot {
  key: LegendCategory;
  short: string;
  icon: LucideIcon;
  held: boolean;
}

interface CrownCabinetProps {
  slots: CabinetSlot[];
  heldCount: number;
  yourRounds: number;
  yourBest: number | null;
}

const AMBER = '#F7931E';
const DEEP_AMBER = '#B26818';
const INK = '#0F172A';

export const CrownCabinet: React.FC<CrownCabinetProps> = ({
  slots,
  heldCount,
  yourRounds,
  yourBest,
}) => {
  const cols = slots.length || 6;
  const footerParts: string[] = [];
  if (yourRounds > 0) footerParts.push(`${yourRounds} rounds`);
  if (yourBest != null) footerParts.push(`best gross ${yourBest}`);

  return (
    <div
      style={{
        margin: '12px 16px',
        background: '#FFFFFF',
        border: '0.5px solid rgba(15,23,42,0.08)',
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
                    : 'rgba(15,23,42,0.015)',
                  border: slot.held ? 'none' : '1.5px dashed rgba(15,23,42,0.20)',
                  boxShadow: slot.held ? '0 2px 8px rgba(247,147,30,0.35)' : 'none',
                }}
              >
                {slot.held ? (
                  <Crown size={18} strokeWidth={2.4} color="#FFFFFF" fill="rgba(255,255,255,0.35)" />
                ) : (
                  <SlotIcon size={15} color="rgba(15,23,42,0.30)" strokeWidth={2.2} />
                )}
              </div>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: slot.held ? DEEP_AMBER : '#94A3B8',
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
      {footerParts.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            fontWeight: 500,
            color: '#64748B',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {footerParts.join(' · ')}
        </div>
      )}
    </div>
  );
};

export default CrownCabinet;
