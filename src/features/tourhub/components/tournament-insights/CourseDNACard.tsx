/**
 * CourseDNACard - Dispatch-style flat ruled rows
 * No icon circles, no section h3 — title handled by parent toggle
 */

import { memo } from 'react';
import type { CourseDNAItem, ImportanceTier } from './types';

interface CourseDNACardProps {
  items: CourseDNAItem[];
  inline?: boolean;
  courseName?: string;
}

const tierToFill: Record<ImportanceTier, number> = {
  critical: 100,
  significant: 80,
  useful: 50,
};

const tierToHexColor: Record<ImportanceTier, string> = {
  critical: '#FF3B30',
  significant: '#FF9500',
  useful: '#3478F6',
};

const tierToLabel: Record<ImportanceTier, string> = {
  critical: 'CRITICAL',
  significant: 'SIGNIFICANT',
  useful: 'USEFUL',
};

export const CourseDNACard = memo(function CourseDNACard({ items, inline, courseName }: CourseDNACardProps) {
  if (items.length === 0) return null;

  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
      {items.map((item, i) => {
        const hexColor = tierToHexColor[item.tier];
        const fillPercent = tierToFill[item.tier];

        return (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 16px',
              borderBottom: i < items.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const, width: 96, flexShrink: 0 }}>
              {item.label}
            </span>
            {/* Importance bar */}
            <div style={{ width: 60, height: 3, background: 'rgba(15,23,42,0.08)', borderRadius: 2, overflow: 'hidden', marginRight: 8, flexShrink: 0 }}>
              <div style={{ width: `${fillPercent}%`, height: '100%', background: hexColor, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: hexColor, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginRight: 8, flexShrink: 0 }}>
              {tierToLabel[item.tier]}
            </span>
            {item.note && (
              <span style={{ fontSize: 10, color: '#94A3B8', flex: 1, textAlign: 'right' as const, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {item.note}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});
