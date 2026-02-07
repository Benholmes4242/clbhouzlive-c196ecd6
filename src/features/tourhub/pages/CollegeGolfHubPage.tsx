import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { TourHubShell } from '../components';
import { CollegeSearch, FranchiseLeaderboard, FranchiseMovers } from '../components/college';
import { useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useTourSeason } from '../hooks/useTourHubData';
import { formatCurrency } from '@/lib/utils/formatCurrency';

/**
 * College Golf Hub - Franchise Leaderboard
 * Premium landing page for college golf rankings.
 */
export function CollegeGolfHubPage() {
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();
  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();

  // Determine #1 college by earnings
  const topCollege = allStats && allStats.length > 0
    ? [...allStats].sort((a, b) => b.earnings_total - a.earnings_total)[0]
    : null;
  const topCollegeMedia = topCollege ? collegeMap?.get(topCollege.normalized_name) : null;
  const topCollegeName = topCollegeMedia?.short_name || topCollegeMedia?.college_name || topCollege?.normalized_name;

  return (
    <TourHubShell>
      {/* Back Link */}
      <div className="pt-4">
        <Link 
          to="/tourhub" 
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tour Hub
        </Link>
      </div>
      
      {/* Premium Header */}
      <header className="py-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            College Rankings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            See how your college stacks up on the PGA Tour. {seasonYear} Season.
          </p>
        </div>
      </header>

      {/* Hero — #1 College */}
      {topCollege && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <Link
            to={`/tourhub/college-golf/${topCollege.normalized_name}`}
            className="block bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.99] group"
          >
            <div className="flex items-center gap-4">
              {/* Medallion */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-xl scale-150" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-background via-background to-muted/30 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden shadow-[0_4px_20px_-4px_rgba(251,191,36,0.25)]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                  {topCollegeMedia?.logo_url ? (
                    <img 
                      src={topCollegeMedia.logo_url} 
                      alt={topCollegeName}
                      className="w-11 h-11 object-contain relative z-10"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground/60 relative z-10">
                      {(topCollegeName || '?').charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Copy */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">#1 This Season</span>
                </div>
                <h2 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {topCollegeName}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatCurrency(topCollege.earnings_total)} in earnings · {topCollege.player_count} alumni
                </p>
              </div>
            </div>
          </Link>
        </motion.section>
      )}
      
      {/* Search Section */}
      <section className="mb-8">
        <CollegeSearch />
      </section>
      
      {/* Franchise Leaderboard */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Franchise Leaderboard
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Ranked by total alumni performance this season
        </p>
        <FranchiseLeaderboard limit={25} />
      </section>
      
      {/* Weekly Movers */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-foreground">
            This Week's Movers
          </h2>
        </div>
        <FranchiseMovers limit={8} />
      </section>
    </TourHubShell>
  );
}
