import React from 'react';
import { KICKER } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * SectionHead — the one heading for the eight Courses page sections
 * (BRIEF_COURSES_PAGE_REBUILD §1a). Deliberately larger than SECTION_TITLE:
 * it carries a magazine section, not a panel. No section writes its own.
 */
export interface SectionHeadProps {
  kicker: string;
  /** Omitted = no title element at all (section 08's list head). */
  title?: string;
  tone?: 'amber' | 'quiet';
}

export function SectionHead({ kicker, title, tone = 'amber' }: SectionHeadProps) {
  return (
    <div>
      <div style={{ ...KICKER, lineHeight: 1, color: tone === 'amber' ? A.AMBER : A.MUTE }}>
        {kicker}
      </div>
      {title ? <h2
        style={{
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: A.INK,
          marginTop: 5,
          marginBottom: 0,
        }}
      >
        {title}
      </h2> : null}
    </div>
  );
}

/** Gap between a section's head and its content — every section reads this. */
export const HEAD_GAP = 14;

/** The wrapper every section's head + content sits in. */
export const SECTION_WRAP: React.CSSProperties = { padding: '20px 16px 14px' };
