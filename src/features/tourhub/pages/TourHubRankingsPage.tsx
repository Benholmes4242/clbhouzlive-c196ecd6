import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Award } from 'lucide-react';
import { TourHubShell, PremiumEmptyState } from '../components';

export function TourHubRankingsPage() {
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
        <h1 className="text-display-lg font-bold text-text-primary">Rankings</h1>
        <p className="text-body-md text-text-secondary mt-1">
          Rankings update automatically as events complete.
        </p>
      </header>
      
      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6">
          <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-text-tertiary" />
          </div>
          <h2 className="text-heading-md font-semibold text-text-primary mb-2">
            OWGR
          </h2>
          <p className="text-body-sm text-text-secondary mb-4">
            Official World Golf Ranking
          </p>
          <span className="inline-block px-3 py-1 rounded-sq-pill bg-surface-alt text-meta text-text-tertiary">
            Coming soon
          </span>
        </div>
        
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6">
          <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-text-tertiary" />
          </div>
          <h2 className="text-heading-md font-semibold text-text-primary mb-2">
            FedExCup
          </h2>
          <p className="text-body-sm text-text-secondary mb-4">
            PGA Tour season standings
          </p>
          <span className="inline-block px-3 py-1 rounded-sq-pill bg-surface-alt text-meta text-text-tertiary">
            Coming soon
          </span>
        </div>
        
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6">
          <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-text-tertiary" />
          </div>
          <h2 className="text-heading-md font-semibold text-text-primary mb-2">
            Tour Standings
          </h2>
          <p className="text-body-sm text-text-secondary mb-4">
            LPGA, DP World & more
          </p>
          <span className="inline-block px-3 py-1 rounded-sq-pill bg-surface-alt text-meta text-text-tertiary">
            Coming soon
          </span>
        </div>
      </div>
    </TourHubShell>
  );
}
