import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AMBER } from '@/features/courses/_shared/tokens';

interface SectionLabelProps {
  text: string;
  /** Lucide icon component rendered before the label (canonical amber eyebrow). */
  icon?: LucideIcon;
}

/**
 * Canonical section eyebrow — matches Tour Hub Overview amber section titles.
 * 10.5px / 800-weight uppercase, AMBER, 0.14em tracking, icon at 11px before text.
 * Used across the Course Detail About tab (Your Journey, About, Course Details,
 * Location, Media) and other surfaces that need a Dispatch-style amber eyebrow.
 */
export const SectionLabel: React.FC<SectionLabelProps> = ({ text, icon: Icon }) => (
  <div style={{ padding: '0 16px', marginBottom: 14 }}>
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10.5,
        fontWeight: 800,
        color: AMBER,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2.4} />}
      {text}
    </span>
  </div>
);

export default SectionLabel;
