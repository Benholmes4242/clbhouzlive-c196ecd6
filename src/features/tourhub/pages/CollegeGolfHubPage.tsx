import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, TrendingUp, Zap, GitCompare } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeSearch, CollegeLeaderboard, CollegeWeeklyMovers } from '../components/college';
import { Button } from '@/components/ui/button';

/**
 * College Golf Hub - Main landing page for college golf content.
 * Features search, weekly movers, leaderboards by various metrics.
 */
export function CollegeGolfHubPage() {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-heading-lg font-bold text-text-primary">
                College Golf
              </h1>
              <p className="text-body-sm text-text-secondary">
                Alumni performance on the PGA Tour
              </p>
            </div>
          </div>
          
          {/* Compare CTA */}
          <Link to="/tourhub/college-golf/compare">
            <Button variant="outline" size="sm" className="gap-2">
              <GitCompare className="w-4 h-4" />
              Compare
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Search Section */}
      <section className="mb-8">
        <CollegeSearch />
      </section>
      
      {/* Weekly Movers */}
      <section className="mb-8">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-accent-warning" />
          This Week's Movers
        </h2>
        <p className="text-body-sm text-text-secondary mb-4">
          Colleges trending up or down this week
        </p>
        <CollegeWeeklyMovers limit={8} />
      </section>
      
      {/* Leaderboards */}
      <section className="mb-6">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-text-tertiary" />
          College Leaderboards
        </h2>
        <p className="text-body-sm text-text-secondary mb-4">
          2025 Season rankings by total alumni performance
        </p>
        <CollegeLeaderboard limit={25} />
      </section>
    </TourHubShell>
  );
}
