import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTourRankingsHealth, type TourHealth } from '@/features/admin/hooks/useTourRankingsHealth';

const TOUR_META: Record<string, { displayName: string; rankingLabel: string }> = {
  euro: { displayName: 'DP World Tour', rankingLabel: 'Race to Dubai' },
  lpga: { displayName: 'LPGA Tour', rankingLabel: 'Race to CME Globe' },
  pgad: { displayName: 'Korn Ferry Tour', rankingLabel: 'Points List' },
  liv:  { displayName: 'LIV Golf', rankingLabel: 'Individual Standings' },
};

function getStatus(tour: TourHealth): 'green' | 'yellow' | 'red' {
  if (tour.total_players === 0 || !tour.last_updated) return 'red';

  const daysSince = (Date.now() - new Date(tour.last_updated).getTime()) / (1000 * 60 * 60 * 24);
  const matchRate = tour.total_players > 0 ? tour.matched_players / tour.total_players : 0;

  if (daysSince > 14 || matchRate < 0.7) return 'red';
  if (daysSince > 8 || matchRate < 0.9) return 'yellow';
  return 'green';
}

const STATUS_DOT: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

function TourHealthCard({ tour }: { tour: TourHealth }) {
  const meta = TOUR_META[tour.tour_code];
  const status = getStatus(tour);

  const timeAgo = tour.last_updated
    ? formatDistanceToNow(new Date(tour.last_updated), { addSuffix: true })
    : 'Never';

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[status])} />
        <span className="text-sm font-semibold text-foreground">{meta?.rankingLabel}</span>
      </div>
      <span className="text-xs text-muted-foreground -mt-1">{meta?.displayName}</span>
      <span className="text-xs text-foreground mt-1">
        {tour.total_players} players · {tour.matched_players} matched
      </span>
      <span className="text-[11px] text-muted-foreground">
        Updated {timeAgo}
      </span>
    </div>
  );
}

export function TourRankingsHealthSection() {
  const { data, isLoading } = useTourRankingsHealth();

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Tour Rankings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Weekly scraper status</p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading tour health…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.map(tour => (
            <TourHealthCard key={tour.tour_code} tour={tour} />
          ))}
        </div>
      )}
    </section>
  );
}
