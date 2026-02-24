import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useTourSeason } from '../../hooks/useTourHubData';
import type { CollegeCompareData } from '../../hooks/useCollegeCompare';
import type { CollegeAlumnus } from '../../hooks/useCollegeAlumni';

interface CollegeCompareHeroProps {
  data: CollegeCompareData;
  className?: string;
  onBack?: () => void;
}

/* ── Section header matching design system ── */
function SectionHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("text-muted-foreground/60", className)}
      style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}
    >
      {children}
    </div>
  );
}

/* ── Metric compare row with visual bar ── */
interface MetricCompareRowProps {
  label: string;
  value1: number;
  value2: number;
  format?: (v: number) => string;
  /** true = lower is better (e.g. scoring avg, putting avg) */
  lowerIsBetter?: boolean;
}

function MetricCompareRow({ label, value1, value2, format = String, lowerIsBetter = false }: MetricCompareRowProps) {
  const total = value1 + value2;
  const pct1 = total > 0 ? (value1 / total) * 100 : 50;
  const pct2 = total > 0 ? (value2 / total) * 100 : 50;

  let isLeading1: boolean;
  let isLeading2: boolean;
  if (lowerIsBetter) {
    isLeading1 = value1 > 0 && value2 > 0 ? value1 < value2 : false;
    isLeading2 = value1 > 0 && value2 > 0 ? value2 < value1 : false;
  } else {
    isLeading1 = value1 > value2;
    isLeading2 = value2 > value1;
  }

  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.1)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={isLeading1 ? 'text-foreground' : 'text-muted-foreground'}
          style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {format(value1)}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500 }} className="text-muted-foreground">
          {label}
        </span>
        <span
          className={isLeading2 ? 'text-foreground' : 'text-muted-foreground'}
          style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {format(value2)}
        </span>
      </div>
      <div className="flex gap-0.5 rounded-full overflow-hidden" style={{ height: 4 }}>
        <div
          className="rounded-l-full"
          style={{
            width: `${pct1}%`,
            backgroundColor: isLeading1 ? '#f59e0b' : '#CBD5E1',
          }}
        />
        <div
          className="rounded-r-full"
          style={{
            width: `${pct2}%`,
            backgroundColor: isLeading2 ? '#f59e0b' : '#CBD5E1',
          }}
        />
      </div>
    </div>
  );
}

/* ── Flat stat section (no card wrapper) ── */
function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <SectionHeader className="mb-3">{title}</SectionHeader>
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}

/* ── Alumni block with stat values ── */
function AlumniCompareBlock({ title, alumni1, alumni2, statKey, emptyLabel }: {
  title: string;
  alumni1: CollegeAlumnus[];
  alumni2: CollegeAlumnus[];
  statKey: 'earnings' | 'world_ranking' | 'wins';
  emptyLabel?: string;
}) {
  const formatStat = (a: CollegeAlumnus) => {
    if (statKey === 'earnings') return formatCurrency(a.earnings || 0);
    if (statKey === 'world_ranking') return a.world_ranking ? `#${a.world_ranking}` : '—';
    if (statKey === 'wins') {
      const w = a.wins || 0;
      return `${w} win${w !== 1 ? 's' : ''}`;
    }
    return '';
  };

  const renderSide = (alumni: CollegeAlumnus[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {alumni.length > 0 ? alumni.map((a, i) => (
        <Link
          key={a.id}
          to={`/tourhub/player/${a.id}`}
          className="flex items-center gap-2 bg-card rounded-xl border border-border/50 hover:border-border transition-colors"
          style={{ padding: '10px 12px' }}
        >
          <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, width: '16px', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
          <div className="w-8 h-8 bg-muted overflow-hidden shrink-0" style={{ borderRadius: '34%' }}>
            <img
              src={getPlayerHeadshotUrl(`${a.first_name} ${a.last_name}`, a.tour_codes?.[0] ?? 'pga')}
              alt={`${a.first_name} ${a.last_name}`}
              className="w-full h-full object-cover object-top"
              onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-foreground block" style={{ fontSize: 13, fontWeight: 600 }}>
              {a.last_name}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {formatStat(a)}
            </span>
          </div>
        </Link>
      )) : (
        <span className="text-muted-foreground py-2" style={{ fontSize: 12, fontWeight: 400 }}>
          {emptyLabel || 'No data available'}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: 28 }}>
      <SectionHeader className="mb-3">{title}</SectionHeader>
      <div className="grid grid-cols-2 gap-4">
        {renderSide(alumni1)}
        {renderSide(alumni2)}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatPct(v: number): string {
  if (!v) return '—';
  return `${v.toFixed(1)}%`;
}

function formatAvg(v: number): string {
  if (!v) return '—';
  return v.toFixed(2);
}

function formatDist(v: number): string {
  if (!v) return '—';
  return `${v.toFixed(1)} yds`;
}

function formatSg(v: number): string {
  if (!v) return '—';
  return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
}

/* ── Main component ── */
export function CollegeCompareHero({ data, className, onBack }: CollegeCompareHeroProps) {
  const { college1, college2 } = data;
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();

  const name1 = college1.media?.short_name || college1.media?.college_name || 'College 1';
  const name2 = college2.media?.short_name || college2.media?.college_name || 'College 2';

  const s1 = college1.stats;
  const s2 = college2.stats;

  // Check if performance/ball-striking data exists
  const hasPerformanceData = !!(
    s1?.avg_scoring || s2?.avg_scoring ||
    s1?.avg_sg_total || s2?.avg_sg_total ||
    s1?.avg_putting || s2?.avg_putting ||
    s1?.avg_scrambling || s2?.avg_scrambling
  );

  const hasBallStrikingData = !!(
    s1?.avg_driving_distance || s2?.avg_driving_distance ||
    s1?.avg_driving_accuracy || s2?.avg_driving_accuracy ||
    s1?.avg_gir || s2?.avg_gir ||
    s1?.avg_sand_saves || s2?.avg_sand_saves
  );

  // Count categories led for summary card (only from populated stats)
  const comparisons: [number, number, boolean][] = [
    [s1?.earnings_total || 0, s2?.earnings_total || 0, false],
    [s1?.wins_total || 0, s2?.wins_total || 0, false],
    [s1?.top10_total || 0, s2?.top10_total || 0, false],
    [s1?.top25_total || 0, s2?.top25_total || 0, false],
    [s1?.events_total || 0, s2?.events_total || 0, false],
    [s1?.player_count || 0, s2?.player_count || 0, false],
  ];

  // Only include performance stats in category count if they exist
  if (hasPerformanceData) {
    comparisons.push(
      [s1?.avg_scoring || 0, s2?.avg_scoring || 0, true],
      [s1?.avg_sg_total || 0, s2?.avg_sg_total || 0, false],
      [s1?.avg_putting || 0, s2?.avg_putting || 0, true],
      [s1?.avg_scrambling || 0, s2?.avg_scrambling || 0, false],
    );
  }
  if (hasBallStrikingData) {
    comparisons.push(
      [s1?.avg_driving_distance || 0, s2?.avg_driving_distance || 0, false],
      [s1?.avg_driving_accuracy || 0, s2?.avg_driving_accuracy || 0, false],
      [s1?.avg_gir || 0, s2?.avg_gir || 0, false],
      [s1?.avg_sand_saves || 0, s2?.avg_sand_saves || 0, false],
    );
  }

  let c1Wins = 0;
  let c2Wins = 0;
  comparisons.forEach(([v1, v2, lowerBetter]) => {
    if (v1 === 0 && v2 === 0) return;
    if (lowerBetter) {
      if (v1 > 0 && v2 > 0) {
        if (v1 < v2) c1Wins++;
        else if (v2 < v1) c2Wins++;
      }
    } else {
      if (v1 > v2) c1Wins++;
      else if (v2 > v1) c2Wins++;
    }
  });

  return (
    <div className={cn('', className)}>
      {/* VS Header */}
      <div className="mb-6">
        {/* Season label centered above the VS row */}
        <div className="flex justify-center mb-2">
          <span className="text-muted-foreground/60" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
            {seasonYear} Season
          </span>
        </div>

        <div className="flex items-start" style={{ gap: 0 }}>
          <Link
            to={`/tourhub/college-golf/${s1?.normalized_name}`}
            className="flex-1 flex flex-col items-center group min-w-0"
          >
            <div className="w-20 h-20 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
              {getCollegeLogoUrl(college1.media?.college_name || name1) ? (
                <img src={getCollegeLogoUrl(college1.media?.college_name || name1)!} alt={name1} className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{name1.charAt(0)}</span>
              )}
            </div>
            <span className="text-foreground group-hover:text-primary transition-colors text-center truncate max-w-full" style={{ fontSize: 16, fontWeight: 600 }}>
              {name1}
            </span>
          </Link>

          {/* VS vertically centered with the 80px logo boxes */}
          <div className="shrink-0 w-16 flex items-center justify-center" style={{ height: 80 }}>
            <span className="text-muted-foreground/40" style={{ fontSize: 16, fontWeight: 800 }}>VS</span>
          </div>

          <Link
            to={`/tourhub/college-golf/${s2?.normalized_name}`}
            className="flex-1 flex flex-col items-center group min-w-0"
          >
            <div className="w-20 h-20 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden mb-2 group-hover:border-primary/30 transition-colors">
              {getCollegeLogoUrl(college2.media?.college_name || name2) ? (
                <img src={getCollegeLogoUrl(college2.media?.college_name || name2)!} alt={name2} className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{name2.charAt(0)}</span>
              )}
            </div>
            <span className="text-foreground group-hover:text-primary transition-colors text-center truncate max-w-full" style={{ fontSize: 16, fontWeight: 600 }}>
              {name2}
            </span>
          </Link>
        </div>
      </div>

      {/* Back button — below VS header */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-muted-foreground active:opacity-70 transition-opacity mb-4"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          ← Back
        </button>
      )}

      {/* Summary Verdict Card */}
      <div className="bg-card rounded-2xl border border-border/50 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <SectionHeader className="mb-3">Season Summary</SectionHeader>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <span className="text-foreground block" style={{ fontSize: 28, fontWeight: 700 }}>{c1Wins}</span>
            <span className="text-muted-foreground block" style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>categories led</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground/40" style={{ fontSize: 14, fontWeight: 600 }}>—</span>
          </div>
          <div className="text-center flex-1">
            <span className="text-foreground block" style={{ fontSize: 28, fontWeight: 700 }}>{c2Wins}</span>
            <span className="text-muted-foreground block" style={{ fontSize: 11, fontWeight: 500, marginTop: 4 }}>categories led</span>
          </div>
        </div>
      </div>

      {/* Season Overview — no card wrapper */}
      <StatSection title="Season Overview">
        <MetricCompareRow label="Earnings" value1={s1?.earnings_total || 0} value2={s2?.earnings_total || 0} format={formatCurrency} />
        <MetricCompareRow label="Wins" value1={s1?.wins_total || 0} value2={s2?.wins_total || 0} />
        <MetricCompareRow label="Top 10s" value1={s1?.top10_total || 0} value2={s2?.top10_total || 0} />
        <MetricCompareRow label="Top 25s" value1={s1?.top25_total || 0} value2={s2?.top25_total || 0} />
        <MetricCompareRow label="Events Played" value1={s1?.events_total || 0} value2={s2?.events_total || 0} />
        <MetricCompareRow label="Players on Tour" value1={s1?.player_count || 0} value2={s2?.player_count || 0} />
      </StatSection>

      {/* Performance Stats — no card wrapper */}
      {hasPerformanceData && (
        <StatSection title="Performance Stats">
          <MetricCompareRow label="Avg Scoring" value1={s1?.avg_scoring || 0} value2={s2?.avg_scoring || 0} format={formatAvg} lowerIsBetter />
          <MetricCompareRow label="Avg SG Total" value1={s1?.avg_sg_total || 0} value2={s2?.avg_sg_total || 0} format={formatSg} />
          <MetricCompareRow label="Avg Putting" value1={s1?.avg_putting || 0} value2={s2?.avg_putting || 0} format={formatAvg} lowerIsBetter />
          <MetricCompareRow label="Avg Scrambling" value1={s1?.avg_scrambling || 0} value2={s2?.avg_scrambling || 0} format={formatPct} />
        </StatSection>
      )}

      {/* Ball Striking — no card wrapper */}
      {hasBallStrikingData && (
        <StatSection title="Ball Striking">
          <MetricCompareRow label="Driving Distance" value1={s1?.avg_driving_distance || 0} value2={s2?.avg_driving_distance || 0} format={formatDist} />
          <MetricCompareRow label="Driving Accuracy" value1={s1?.avg_driving_accuracy || 0} value2={s2?.avg_driving_accuracy || 0} format={formatPct} />
          <MetricCompareRow label="GIR" value1={s1?.avg_gir || 0} value2={s2?.avg_gir || 0} format={formatPct} />
          <MetricCompareRow label="Sand Saves" value1={s1?.avg_sand_saves || 0} value2={s2?.avg_sand_saves || 0} format={formatPct} />
        </StatSection>
      )}

      {/* Alumni Sections */}
      <AlumniCompareBlock
        title="Top Earners"
        alumni1={college1.topEarners}
        alumni2={college2.topEarners}
        statKey="earnings"
      />
      <AlumniCompareBlock
        title="Best World Rankings"
        alumni1={college1.topRanked}
        alumni2={college2.topRanked}
        statKey="world_ranking"
      />
      <AlumniCompareBlock
        title="Top Winners"
        alumni1={college1.topWinners}
        alumni2={college2.topWinners}
        statKey="wins"
        emptyLabel="No winners this season"
      />
    </div>
  );
}
