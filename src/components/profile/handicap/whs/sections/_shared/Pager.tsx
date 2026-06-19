import React, { useMemo } from 'react';

interface Props {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}

const INK_FAINT = 'rgba(0,0,0,0.30)';

export const Pager: React.FC<Props> = ({ page, totalPages, onChange }) => {
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '14px 20px 6px',
      }}
    >
      {dots.map((d, idx) =>
        d.kind === 'gap' ? (
          <span
            key={`gap-${idx}`}
            aria-hidden
            style={{ color: INK_FAINT, fontSize: 11, fontWeight: 700 }}
          >
            ·
          </span>
        ) : (
          <button
            type="button"
            key={`p-${d.i}`}
            aria-label={`Go to page ${(d.i ?? 0) + 1}`}
            aria-current={d.i === page ? 'true' : undefined}
            onClick={() => {
              if (d.i != null && d.i !== page) onChange(d.i);
            }}
            style={{
              width: d.i === page ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: d.i === page ? '#0F172A' : 'rgba(0,0,0,0.22)',
              border: 'none',
              padding: 0,
              cursor: d.i === page ? 'default' : 'pointer',
              transition: 'all 200ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          />
        ),
      )}
    </div>
  );
};

export default Pager;
