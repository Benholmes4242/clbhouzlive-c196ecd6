import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}

const HAIRLINE = 'rgba(15,23,42,0.08)';
const INK = '#0F172A';
const INK_FAINT = 'rgba(15,23,42,0.30)';
const AMBER = '#F7931E';
const CARD_BG = '#FFFFFF';

export const Pager: React.FC<Props> = ({ page, totalPages, onChange }) => {
  // Condense dots if there are too many — show first, current, last with separators
  const dots = useMemo(() => {
    if (totalPages <= 8) {
      return Array.from({ length: totalPages }, (_, i) => ({ kind: 'page' as const, i }));
    }
    const out: Array<{ kind: 'page' | 'gap'; i?: number }> = [];
    out.push({ kind: 'page', i: 0 });
    if (page > 2) out.push({ kind: 'gap' });
    if (page > 1) out.push({ kind: 'page', i: page - 1 });
    if (page > 0 && page < totalPages - 1) out.push({ kind: 'page', i: page });
    if (page < totalPages - 2) out.push({ kind: 'page', i: page + 1 });
    if (page < totalPages - 3) out.push({ kind: 'gap' });
    out.push({ kind: 'page', i: totalPages - 1 });
    return out.filter((d, idx, arr) => {
      if (idx === 0) return true;
      const prev = arr[idx - 1];
      return !(d.kind === 'page' && prev.kind === 'page' && d.i === prev.i);
    });
  }, [page, totalPages]);

  const atStart = page === 0;
  const atEnd = page === totalPages - 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px 4px',
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (!atStart) onChange(page - 1);
        }}
        disabled={atStart}
        aria-label="Previous page"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 12px',
          borderRadius: 999,
          border: `1px solid ${HAIRLINE}`,
          background: atStart ? 'rgba(15,23,42,0.02)' : CARD_BG,
          color: atStart ? INK_FAINT : INK,
          fontSize: 12,
          fontWeight: 700,
          cursor: atStart ? 'default' : 'pointer',
          letterSpacing: '0.01em',
        }}
      >
        <ChevronLeft size={14} strokeWidth={2.4} />
        Prev
      </button>

      <div
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {dots.map((d, idx) =>
          d.kind === 'gap' ? (
            <span
              key={`gap-${idx}`}
              style={{ color: INK_FAINT, fontSize: 11, fontWeight: 700 }}
            >
              ·
            </span>
          ) : (
            <span
              key={`p-${d.i}`}
              style={{
                width: d.i === page ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: d.i === page ? AMBER : 'rgba(15,23,42,0.18)',
                transition: 'all 200ms ease',
              }}
            />
          ),
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (!atEnd) onChange(page + 1);
        }}
        disabled={atEnd}
        aria-label="Next page"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 12px',
          borderRadius: 999,
          border: `1px solid ${HAIRLINE}`,
          background: atEnd ? 'rgba(15,23,42,0.02)' : CARD_BG,
          color: atEnd ? INK_FAINT : INK,
          fontSize: 12,
          fontWeight: 700,
          cursor: atEnd ? 'default' : 'pointer',
          letterSpacing: '0.01em',
        }}
      >
        Next
        <ChevronRight size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default Pager;
