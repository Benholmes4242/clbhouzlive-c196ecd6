import React from 'react';
import { format } from 'date-fns';
import { useRecentRounds } from '@/lib/whs/hooks';

interface Props {
  connectionId: string;
}

const fmtDiff = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const RowSkeleton = () => (
  <div className="px-5 py-3 animate-pulse flex items-center justify-between">
    <div className="space-y-1.5">
      <div className="h-3.5 w-40 bg-muted rounded" />
      <div className="h-3 w-24 bg-muted/60 rounded" />
    </div>
    <div className="h-4 w-12 bg-muted rounded" />
  </div>
);

export const RecentRoundsList: React.FC<Props> = ({ connectionId }) => {
  const { data: recent, isLoading: recentLoading } = useRecentRounds(connectionId);

  return (
    <section className="mb-6">
      <div className="px-5 flex items-end justify-between mb-2">
        <h3 className="text-[16px] font-bold text-foreground">Recent rounds</h3>
        <span className="text-[12px] text-muted-foreground">Last 20</span>
      </div>
      <div>
        {recentLoading ? (
          Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
        ) : recent && recent.length > 0 ? (
          recent.map((r, idx) => (
            <div
              key={r.id}
              className="px-5 py-3 flex items-center justify-between"
              style={{
                borderTop: idx === 0 ? 'none' : '1px solid rgba(15,23,42,0.06)',
              }}
            >
              <div className="min-w-0 mr-3">
                <p className="text-[15px] font-semibold text-foreground truncate">
                  {r.course?.name ?? 'Unknown course'}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {format(new Date(r.play_date), 'EEE d MMM')}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[16px] font-bold text-foreground tabular-nums">
                  {r.adjusted_gross ?? '—'}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium tabular-nums"
                  style={{ background: 'rgba(15,23,42,0.05)', color: 'rgba(15,23,42,0.78)' }}
                >
                  {r.is_counter && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#10B981' }}
                    />
                  )}
                  {fmtDiff(r.handicap_differential)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="px-5 text-[14px] text-muted-foreground">No rounds yet.</p>
        )}
      </div>
    </section>
  );
};

export default RecentRoundsList;
