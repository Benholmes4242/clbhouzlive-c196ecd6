/**
 * SectionHeader — Shared section header for Tour Hub Overview sections.
 *
 * Used by Tournament Calendar, World Rankings, Stat Watch, and College Rivalry.
 * Renders the canonical pattern: amber accent bar + caps eyebrow + title +
 * optional subtitle + optional right-side action (e.g. "View All ›" link
 * or "UPDATED 6D AGO" timestamp).
 *
 * Spec (locked):
 * - Container marginBottom: 18
 * - Bar: 3×14, AMBER, borderRadius 2
 * - Bar→eyebrow gap: 10
 * - Eyebrow: 11px / 900 / AMBER / letterSpacing 1.5px / uppercase
 * - Bar row → title gap: 8 (marginBottom on bar row)
 * - Title: 26px / 900 / INK / letterSpacing -0.6 / lineHeight 1.05
 * - Title row → subtitle gap: 4
 * - Subtitle: 13px / 500 / SLATE_600 / lineHeight 1.4 / letterSpacing -0.1
 */

import type { ReactNode } from 'react';

const INK = '#0F172A';
const AMBER = '#F7931E';
const SLATE_600 = '#475569';

export interface SectionHeaderProps {
  eyebrow: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      {/* Bar + eyebrow row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            background: AMBER,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: AMBER,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </span>
      </div>

      {/* Title row (with optional action) */}
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          <h2
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: INK,
              letterSpacing: '-0.6px',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h2>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: SLATE_600,
            lineHeight: 1.4,
            letterSpacing: '-0.1px',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
