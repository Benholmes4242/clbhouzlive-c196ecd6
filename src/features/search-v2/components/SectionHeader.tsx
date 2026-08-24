import type React from 'react';
import { ChevronRight } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { KICKER as KICKER_METRICS, LABEL as LABEL_METRICS } from '@/lib/tokens/type';

/**
 * Canonical metrics; the surface supplies the ink.
 * MICRO_BRIEF_SEARCH_OVERLAY_TYPE_SCALE: fontSize is a LOCAL TRIAL override
 * (9 -> 11). Tracking, weight and transform still come from the shared token —
 * only the size is local. Do NOT repoint KICKER in lib/tokens/type (18
 * importers); this is a trial, not a fork.
 */
const KICKER: React.CSSProperties = { ...KICKER_METRICS, fontSize: 11, color: A.INK };

interface Props {
  label: string;
  onSeeAll?: () => void;
  /** Arbitrary right-slot action (e.g. RecentsList's Clear). */
  right?: React.ReactNode;
}

/** The ONLY definition of the search-overlay kicker style. */
export function SectionHeader({ label, onSeeAll, right }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '16px 16px 12px',
      }}
    >
      <span style={KICKER}>{label}</span>
      {right ??
        (onSeeAll && (
          <button type="button" onClick={onSeeAll} style={ACTION}>
            See all
            <ChevronRight size={11} strokeWidth={2.4} />
          </button>
        ))}
    </div>
  );
}

/**
 * MICRO_BRIEF_SEARCH_OVERLAY_TYPE_SCALE: fontSize is a LOCAL TRIAL override
 * (LABEL 8 -> 10). Shared LABEL has 21 importers and stays at 8.
 */
export const ACTION: React.CSSProperties = {
  ...LABEL_METRICS,
  fontSize: 10,
  color: A.INK,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
};
