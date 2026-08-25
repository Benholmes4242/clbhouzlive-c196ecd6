import { KICKER } from '@/features/courses/components/holes/analytical/tokens';
import React from 'react';
import { Crown, type LucideIcon } from 'lucide-react';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import type { WindowToggleVariant } from '../types';
import { ScopeSegment } from '@/components/shared/ScopeSegment';


export interface CabinetSlot {
  key: LegendCategory;
  short: string;
  icon: LucideIcon;
  held: boolean;
  /** ISO date the viewer took this crown — used to render "Held Nd". */
  attainedAt?: string | null;
}

function daysHeld(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function reignLabel(days: number): string {
  if (days === 0) return 'Held today';
  if (days === 1) return 'Held 1d';
  if (days < 30) return `Held ${days}d`;
  if (days < 365) return `Held ${Math.floor(days / 30)}mo`;
  return `Held ${Math.floor(days / 365)}y`;
}

interface CrownCabinetProps {
  slots: CabinetSlot[];
  heldCount: number;
  window: LegendWindow;
  onWindowChange: (w: LegendWindow) => void;
  toggleVariant?: WindowToggleVariant;
  /** Render only the squircle strip, without card chrome / header / window toggle. */
  bare?: boolean;
}

const HELD_LABEL = 'var(--hcp-gold-text)';
const INK = 'var(--hcp-t-100)';

export const CrownCabinet: React.FC<CrownCabinetProps> = ({
  slots,
  heldCount,
  window,
  onWindowChange,
  toggleVariant = 'dark',
  bare = false,
}) => {
  const cols = slots.length || 6;
  const orderedSlots = [...slots].sort((a, b) => Number(b.held) - Number(a.held));

  const strip = (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}
    >
      {orderedSlots.map((slot) => {
        const SlotIcon = slot.icon;
        const held = slot.held;
        const reignDays = held ? daysHeld(slot.attainedAt) : null;
        return (
          <div
            key={slot.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
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
                background: held
                  ? 'linear-gradient(135deg, #FBBC2E, #E07F0E)'
                  : 'var(--hcp-tint-3)',
                border: held ? 'none' : '1.5px dashed var(--hcp-dash)',
                boxShadow: held ? '0 2px 8px rgba(247,147,30,0.35)' : 'none',
              }}
            >
              {held ? (
                <Crown size={18} strokeWidth={2.4} color="#FFFFFF" fill="rgba(255,255,255,0.35)" />
              ) : (
                <SlotIcon size={15} color="var(--hcp-t-30)" strokeWidth={2.2} />
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: held ? HELD_LABEL : 'var(--hcp-t-40)',
                textAlign: 'center',
                lineHeight: 1.15,
              }}
            >
              {slot.short}
            </span>
            {held && reignDays != null && (
              <span
                className="tabular-nums"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--hcp-t-55)',
                  letterSpacing: '-0.005em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {reignLabel(reignDays)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  if (bare) {
    if (slots.length === 0) return null;
    return strip;
  }


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
          const held = slot.held;
          const reignDays = held ? daysHeld(slot.attainedAt) : null;
          return (
            <div
              key={slot.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
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
                  background: held
                    ? 'linear-gradient(135deg, #FBBC2E, #E07F0E)'
                    : 'var(--hcp-tint-3)',
                  border: held ? 'none' : '1.5px dashed var(--hcp-dash)',
                  boxShadow: held ? '0 2px 8px rgba(247,147,30,0.35)' : 'none',
                }}
              >
                {held ? (
                  <Crown size={18} strokeWidth={2.4} color="#FFFFFF" fill="rgba(255,255,255,0.35)" />
                ) : (
                  <SlotIcon size={15} color="var(--hcp-t-30)" strokeWidth={2.2} />
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: held ? HELD_LABEL : 'var(--hcp-t-40)',
                  textAlign: 'center',
                  lineHeight: 1.15,
                }}
              >
                {slot.short}
              </span>
              {held && reignDays != null && (
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--hcp-t-55)',
                    letterSpacing: '-0.005em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reignLabel(reignDays)}
                </span>
              )}
            </div>
          );
        })}
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
  );
};

export default CrownCabinet;
