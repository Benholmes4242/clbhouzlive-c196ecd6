import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, TrendingUp, Zap } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeSearch, CollegeLeaderboard, CollegeWeeklyMovers } from '../components/college';
import { useTourSeason } from '../hooks/useTourHubData';

/**
 * College Golf Hub - Main landing page for college golf content.
 * Features search, leaderboards by various metrics, and weekly movers.
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
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tour Hub
        </Link>
      </div>
      
      {/* Header */}
      <header className="py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-text-primary">
              College Rankings
            </h1>
            <p className="text-body-sm text-text-secondary">
              See how your college stacks up on the PGA Tour
            </p>
          </div>
        </div>
      </header>
      
      {/* Search Section */}
      <section className="mb-8">
        <CollegeSearch />
      </section>
      
      {/* Leaderboards - Primary content */}
      <section className="mb-8">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-text-tertiary" />
          College Leaderboards
        </h2>
        <p className="text-body-sm text-text-secondary mb-4">
          {seasonYear} Season rankings by total alumni performance
        </p>
        <CollegeLeaderboard limit={25} />
      </section>
      
      {/* Weekly Movers - Secondary content */}
      <section className="mb-6">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-accent-warning" />
          This Week's Movers
        </h2>
        <CollegeWeeklyMovers limit={8} />
      </section>
    </TourHubShell>
  );
}
