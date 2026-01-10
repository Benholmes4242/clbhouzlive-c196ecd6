import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Search, Trophy, TrendingUp } from 'lucide-react';
import { TourHubShell, PremiumEmptyState } from '../components';

/**
 * College Golf Hub - Main landing page for college golf content.
 * Sprint 1: Placeholder structure, to be expanded with leaderboards in Sprint 2/3.
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
      </header>
      
      {/* Search Section - Coming Soon */}
      <section className="mb-6">
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-4">
          <div className="flex items-center gap-3 text-text-tertiary">
            <Search className="w-5 h-5" />
            <span className="text-body-sm">Search colleges coming soon...</span>
          </div>
        </div>
      </section>
      
      {/* Featured Colleges Placeholder */}
      <section className="mb-6">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-text-tertiary" />
          Featured Colleges
        </h2>
        <PremiumEmptyState
          title="Coming soon"
          description="Top performing college programs ranked by PGA Tour wins, earnings, and active alumni."
        />
      </section>
      
      {/* Leaderboards Preview Placeholder */}
      <section className="mb-6">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-text-tertiary" />
          College Leaderboards
        </h2>
        <PremiumEmptyState
          title="Leaderboards coming soon"
          description="Compare colleges by total earnings, wins, cuts made, and average world ranking."
        />
      </section>
    </TourHubShell>
  );
}
