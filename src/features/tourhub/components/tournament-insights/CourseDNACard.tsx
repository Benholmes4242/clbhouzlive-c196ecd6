/**
 * CourseDNACard - What wins here
 * Dispatch-style flat ruled rows — no icon circles
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
    <div style={{ background: '#F8FAFC' }}>
      {/* Section rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px', borderBottom: '0.5px solid rgba(15,23,42,0.08)', marginBottom: 0 }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          What Matters{courseName ? ` at ${courseName}` : ''}
        </span>
      </div>

      <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, i) => {
          const hexColor = tierToHexColor[item.tier];
          const fillPercent = tierToFill[item.tier];

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < items.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', flex: 1 }}>
                {item.label}
              </span>
              <div style={{ width: 100, height: 3, background: 'rgba(15,23,42,0.06)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ width: `${fillPercent}%`, height: '100%', background: hexColor, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: hexColor, letterSpacing: '0.09em', width: 72, textAlign: 'right' as const, flexShrink: 0 }}>
                {tierToLabel[item.tier]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
