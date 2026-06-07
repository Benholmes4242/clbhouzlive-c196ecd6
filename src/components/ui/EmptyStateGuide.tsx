/**
 * EmptyStateGuide — Editorial caps eyebrow + list of guidance items.
 *
 * Used in empty-state compositions to teach the user what content to contribute.
 * Each item renders as a tinted card row with an amber-tinted icon square,
 * label, and sub-description.
 *
 * Items accept either an `emoji` string OR an `icon` (a Lucide component) —
 * existing call sites use Lucide icons, future ones can use emoji.
 *
 * Call site:
 *   <EmptyStateGuide
 *     kicker="What to include"
 *     items={[
 *       { icon: Flag, label: 'Course condition', sub: 'Greens, fairways…' },
 *       { emoji: '⭐', label: 'Your rating', sub: 'How good is it?' },
 *     ]}
 *   />
 */

import React from 'react';
import { SectionLabel } from '@/components/courses/course-detail/parts/SectionLabel';
import { ListChecks, type LucideIcon } from 'lucide-react';

const INK = '#0F172A';
const INK_FAINT = '#94A3B8';
const AMBER = '#F7931E';
const INK_TINT_02 = 'rgba(15,23,42,0.02)';
const INK_TINT_06 = 'rgba(15,23,42,0.06)';

export interface EmptyStateGuideItem {
  /** Lucide icon component (preferred — matches existing guide composition). */
  icon?: LucideIcon;
  /** Emoji alternative (used if no icon provided). */
  emoji?: string;
  label: string;
  sub: string;
}

interface EmptyStateGuideProps {
  /** Caps text above the list (e.g. "What to include", "What to share"). */
  kicker: string;
  /** Guidance items — typically 3-4 entries. */
  items: EmptyStateGuideItem[];
  /** Optional className for outer spacing. */
  className?: string;
}

export const EmptyStateGuide: React.FC<EmptyStateGuideProps> = ({
  kicker,
  items,
  className,
}) => {
  return (
    <div className={className}>
      <SectionLabel text={kicker} icon={ListChecks} />
      <div style={{ padding: '0 16px' }}>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: i === items.length - 1 ? 0 : 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: INK_TINT_02,
                border: `0.5px solid ${INK_TINT_06}`,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 1,
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: 'rgba(247,147,30,0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {Icon ? (
                  <Icon size={13} strokeWidth={2.2} color={AMBER} />
                ) : (
                  <span style={{ fontSize: 12, lineHeight: 1 }}>{item.emoji}</span>
                )}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 11, color: INK_FAINT, lineHeight: 1.4 }}>
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmptyStateGuide;
