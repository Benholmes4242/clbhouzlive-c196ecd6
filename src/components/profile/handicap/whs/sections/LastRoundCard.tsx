import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useLastRound } from '@/lib/whs/hooks';
import LastRoundSheet from './last-round/LastRoundSheet';

interface Props {
  connectionId: string;
}

const fmtDiff = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const relativeDay = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(d, 'd MMM');
};

export const LastRoundCard: React.FC<Props> = ({ connectionId }) => {
  const { data: lastRound, isLoading } = useLastRound(connectionId);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className="px-5 mb-7">
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-muted/60 rounded" />
          <div className="h-5 w-44 bg-muted rounded" />
          <div className="h-7 w-56 bg-muted/70 rounded" />
        </div>
      ) : lastRound ? (
        <>
          <button
            onClick={() => setSheetOpen(true)}
            aria-label={`View detail for ${lastRound.course?.name ?? 'last round'}`}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              transition: 'opacity 150ms ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            onTouchStart={(e) => (e.currentTarget.style.opacity = '0.7')}
            onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
                Last Round
              </p>
              <p className="text-[12px] text-muted-foreground" style={{ marginRight: 22 }}>
                {relativeDay(lastRound.play_date)}
              </p>
            </div>
            <h3 className="text-[19px] font-bold text-foreground leading-tight mb-3">
              {lastRound.course?.name ?? 'Unknown course'}
            </h3>
            <div className="flex items-baseline gap-6 mb-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Gross
                </p>
                <p className="text-[30px] font-bold text-foreground tabular-nums leading-none">
                  {lastRound.adjusted_gross ?? '—'}
                </p>
              </div>
              {lastRound.stableford_points !== null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                    Stableford
                  </p>
                  <p className="text-[20px] font-semibold text-foreground tabular-nums leading-none">
                    {lastRound.stableford_points}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                  Diff
                </p>
                <p className="text-[20px] font-semibold text-foreground tabular-nums leading-none">
                  {fmtDiff(lastRound.handicap_differential)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span>
                {lastRound.marker_name ?? 'Tee'} ·{' '}
                {lastRound.course_rating ?? '—'}/{lastRound.slope_rating ?? '—'}
              </span>
              {lastRound.is_counter && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold"
                  style={{ background: 'rgba(16,185,129,0.10)', color: '#059669' }}
                >
                  <CheckCircle2 className="h-3 w-3" /> Counter
                </span>
              )}
            </div>
            <ChevronRight
              size={18}
              strokeWidth={2.2}
              color="rgba(15,23,42,0.40)"
              style={{ position: 'absolute', top: 0, right: 0 }}
            />
          </button>
          <LastRoundSheet
            connectionId={connectionId}
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
          />
        </>
      ) : (
        <p className="text-[14px] text-muted-foreground">
          Your rounds will appear here as soon as you start posting scores in MyEG.
        </p>
      )}
    </section>
  );
};

export default LastRoundCard;
