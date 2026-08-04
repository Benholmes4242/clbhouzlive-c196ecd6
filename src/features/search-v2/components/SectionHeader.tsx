import type React from 'react';
import { ChevronRight } from 'lucide-react';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';

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
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.INK,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
};
