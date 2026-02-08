import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeSearch, FranchiseLeaderboard, FranchiseMovers } from '../components/college';
import { CollegeHeroBanner } from '../components/college/CollegeHeroBanner';
import { AlumniFaceStrip } from '../components/college/AlumniFaceStrip';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useHeroAlumni } from '../hooks/useBatchCollegeAlumni';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s';
const VALID_METRICS = new Set<string>(['earnings', 'wins', 'cuts', 'top10s']);

function getMetricValue(s: CollegeSeasonStats, metric: MetricTab): number {
  switch (metric) {
    case 'wins': return s.wins_total;
    case 'cuts': return s.cuts_total;
    case 'top10s': return s.top10_total;
    default: return s.earnings_total;
  }
}

/**
 * College Golf Hub - Immersive rankings page with full-bleed hero,
 * alumni showcase, franchise leaderboard, and weekly movers.
 */
export function CollegeGolfHubPage() {
  const [searchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';

  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();

  // Determine #1 college for the active metric
  const topCollege = useMemo(() => {
    if (!allStats?.length) return null;
    return [...allStats].sort((a, b) => getMetricValue(b, activeMetric) - getMetricValue(a, activeMetric))[0];
  }, [allStats, activeMetric]);

  const topCollegeMedia = topCollege ? collegeMap?.get(topCollege.normalized_name) ?? null : null;

  // Alumni for hero face strip
  const { data: heroAlumni } = useHeroAlumni(topCollege?.normalized_name);

  return (
    <TourHubShell immersive>
      {/* Back Link — floating over hero */}
      <div className="absolute top-12 left-4 z-20">
        <Link
          to="/tourhub"
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors backdrop-blur-sm bg-black/20 rounded-full px-3 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Tour Hub
        </Link>
      </div>

      {/* Immersive Hero — adapts per active metric tab */}
      {topCollege && (
        <CollegeHeroBanner
          stats={topCollege}
          college={topCollegeMedia}
        />
      )}

      {/* Alumni Face Strip — overlaps hero */}
      {heroAlumni && heroAlumni.length > 0 && topCollege && (
        <AlumniFaceStrip
          alumni={heroAlumni}
          collegeName={topCollegeMedia?.short_name || topCollegeMedia?.college_name || topCollege.normalized_name}
          collegeSlug={topCollege.normalized_name}
          totalAlumniCount={topCollege.player_count}
        />
      )}

      {/* Content area with padding */}
      <div className="px-4 pt-6 pb-24">
        {/* Search Section */}
        <section className="mb-6">
          <CollegeSearch />
        </section>

        {/* Franchise Leaderboard (includes sticky tabs) */}
        <section className="mb-10">
          <FranchiseLeaderboard limit={25} />
        </section>

        {/* Weekly Movers */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              This Week's Movers
            </h2>
          </div>
          <FranchiseMovers limit={8} />
        </section>
      </div>
    </TourHubShell>
  );
}
