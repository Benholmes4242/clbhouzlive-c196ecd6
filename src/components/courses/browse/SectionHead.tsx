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
  title: string;
  subline?: string;
  tone?: 'amber' | 'quiet';
}

export function SectionHead({ kicker, title, subline, tone = 'amber' }: SectionHeadProps) {
  return (
    <div>
      <div style={{ ...KICKER, lineHeight: 1, color: tone === 'amber' ? A.AMBER : A.MUTE }}>
        {kicker}
      </div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.036em',
          lineHeight: 1.1,
          color: A.INK,
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {title}
      </h2>
      {subline ? (
        <p style={{ fontSize: 12, lineHeight: 1.5, color: A.DIM, marginTop: 8, marginBottom: 0 }}>
          {subline}
        </p>
      ) : null}
    </div>
  );
}

/** Gap between a section's head and its content — every section reads this. */
export const HEAD_GAP = 14;

/** The wrapper every section's head + content sits in. */
export const SECTION_WRAP: React.CSSProperties = { padding: '20px 16px 14px' };
