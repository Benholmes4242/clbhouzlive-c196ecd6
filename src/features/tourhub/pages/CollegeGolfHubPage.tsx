import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeSearch, FranchiseLeaderboard, FranchiseMovers } from '../components/college';
import { useTourSeason } from '../hooks/useTourHubData';

/**
 * College Golf Hub - Franchise Leaderboard
 * Premium landing page for college golf rankings.
 */
export function CollegeGolfHubPage() {
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || 2025;

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
