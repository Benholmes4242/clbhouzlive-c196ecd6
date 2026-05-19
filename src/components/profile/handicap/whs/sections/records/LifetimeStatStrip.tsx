import React, { useMemo } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { SectionHeader } from '../_shared/atoms';

interface Props {
  connectionId: string;
}

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const D_BG = 'var(--hcp-bg-1)';
const D_LINE = 'var(--hcp-line)';
const D_T100 = 'var(--hcp-t-100)';
const D_T60 = 'var(--hcp-t-60)';
const D_BG3 = 'var(--hcp-bg-3)';

interface Cell {
  label: string;
  value: string;
}

export const LifetimeStatStrip: React.FC<Props> = ({ connectionId }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);

  const cells: Cell[] = useMemo(() => {
    const list = scores ?? [];
    if (list.length === 0) {
      return [
        { label: 'ROUNDS', value: '—' },
        { label: 'COUNTERS', value: '—' },
        { label: 'BEST GROSS', value: '—' },
        { label: 'BEST DIFF', value: '—' },
        { label: 'BEST STABLEFORD', value: '—' },
        { label: 'COURSES PLAYED', value: '—' },
      ];
    }

    const counters = list.filter((s) => s.is_counter).length;
    const grosses = list.map((s) => s.adjusted_gross).filter((v): v is number => v != null);
    const diffs = list.map((s) => s.handicap_differential).filter((v): v is number => v != null);
    const stables = list.map((s) => s.stableford_points).filter((v): v is number => v != null);
    const courseIds = new Set(
      list
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s) => (s.course as any)?.course_id ?? (s.course as any)?.name)
        .filter(Boolean),
    );

    return [
      { label: 'ROUNDS', value: String(list.length) },
      { label: 'COUNTERS', value: String(counters) },
      { label: 'BEST GROSS', value: grosses.length ? String(Math.min(...grosses)) : '—' },
      { label: 'BEST DIFF', value: diffs.length ? fmtDiff(Math.min(...diffs)) : '—' },
      { label: 'BEST STABLEFORD', value: stables.length ? String(Math.max(...stables)) : '—' },
      { label: 'COURSES PLAYED', value: courseIds.size ? String(courseIds.size) : '—' },
    ];
  }, [scores]);

  return (
    <section style={{ marginTop: 24 }}>
      <SectionHeader eyebrow="LIFETIME" title="Your career so far" />
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            background: D_BG,
            border: `1px solid ${D_LINE}`,
            borderRadius: 14,
            padding: 16,
            fontFamily: FONT,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              rowGap: 14,
            }}
          >
            {(isLoading ? Array.from({ length: 6 }) : cells).map((c, i) => {
              const withRight = (i + 1) % 3 !== 0;
              return (
                <div
                  key={i}
                  style={{
                    padding: '4px 10px',
                    borderRight: withRight ? `0.5px solid ${D_LINE}` : 'none',
                    textAlign: 'center',
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ height: 9, width: '70%', margin: '0 auto 8px', background: D_BG3, borderRadius: 2 }} />
                      <div style={{ height: 22, width: '50%', margin: '0 auto', background: D_BG3, borderRadius: 3 }} />
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: D_T60,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          marginBottom: 6,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {(c as Cell).label}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: D_T100,
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.02em',
                          lineHeight: 1,
                        }}
                      >
                        {(c as Cell).value}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifetimeStatStrip;
