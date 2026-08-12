import type React from 'react';
import { ChevronRight } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { KICKER as KICKER_METRICS, LABEL as LABEL_METRICS } from '@/lib/tokens/type';

/** Canonical metrics; the surface supplies the ink. */
const KICKER: React.CSSProperties = { ...KICKER_METRICS, color: A.INK };

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

export const ACTION: React.CSSProperties = {
  ...LABEL_METRICS,
  color: A.INK,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
};
