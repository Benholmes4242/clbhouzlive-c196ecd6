import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Flag, TrendingUp } from 'lucide-react';
import { TourHubShell, PremiumEmptyState } from '../components';

export function TourHubPlayerPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  
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
      
      {/* Player Header */}
      <header className="py-6">
        <div className="bg-surface-card border border-border-subtle rounded-sq-lg p-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center">
            <User className="w-10 h-10 text-text-tertiary" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-text-primary">
              Player Profile
            </h1>
            <p className="text-body-sm text-text-secondary">
              Athlete ID: {athleteId}
            </p>
          </div>
        </div>
      </header>
      
      {/* Recent Finishes Placeholder */}
      <section className="mb-6">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Flag className="w-5 h-5 text-text-tertiary" />
          Recent Finishes
        </h2>
        <PremiumEmptyState
          title="Coming soon"
          description="Recent tournament results will be displayed here as player data becomes available."
        />
      </section>
      
      {/* Stats Placeholder */}
      <section className="mb-6">
        <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-text-tertiary" />
          Stats
        </h2>
        <PremiumEmptyState
          title="Stats coming soon"
          description="Player statistics and performance metrics will appear here in a future update."
        />
      </section>
    </TourHubShell>
  );
}
