/**
 * EventTag — designation tag (Major / Signature / Rolex Series / Playoff).
 *
 * Sits inline next to TourPill. Multi-tag handling is the caller's concern;
 * use the priority order defined in the brief: major > playoff > signature > rolex.
 */
import { Star } from 'lucide-react';

export type EventTagKind = 'major' | 'signature' | 'rolex' | 'playoff';

interface EventTagProps {
  kind: EventTagKind;
  /** Use abbreviated form (ROLEX vs ROLEX SERIES) on tight viewports. */
  abbreviated?: boolean;
}

const VARIANTS: Record<EventTagKind, { bg: string; border: string; color: string; label: string; abbr?: string; icon?: boolean }> = {
  major: {
    bg: 'rgba(247,147,30,0.08)',
    border: 'rgba(247,147,30,0.30)',
    color: '#F7931E',
    label: 'MAJOR',
    icon: true,
  },
  signature: {
    bg: 'rgba(16,163,74,0.08)',
    border: 'rgba(16,163,74,0.30)',
    color: '#0A5A3C',
    label: 'SIGNATURE',
  },
  rolex: {
    bg: 'rgba(10,90,60,0.08)',
    border: 'rgba(10,90,60,0.30)',
    color: '#0A5A3C',
    label: 'ROLEX SERIES',
    abbr: 'ROLEX',
  },
  playoff: {
    bg: 'rgba(180,83,9,0.08)',
    border: 'rgba(180,83,9,0.30)',
    color: '#B45309',
    label: 'PLAYOFF',
  },
};

export function EventTag({ kind, abbreviated }: EventTagProps) {
  const v = VARIANTS[kind];
  const label = abbreviated && v.abbr ? v.abbr : v.label;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '3px 6px',
        borderRadius: 4,
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: 0.6,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {v.icon && <Star size={9} fill={v.color} stroke={v.color} />}
      {label}
    </span>
  );
}
