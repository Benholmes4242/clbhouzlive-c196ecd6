import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, DollarSign, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { TourHubShell } from '../components/TourHubShell';
import { TournamentDetailTabs, type TournamentDetailTab } from '../components/TourHubTabs';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourTournament } from '../hooks/useTourHubData';

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [activeTab, setActiveTab] = useState<TournamentDetailTab>('overview');
  const { data: tournament, isLoading } = useTourTournament(tournamentId || '');
  
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="animate-pulse space-y-4 pt-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </TourHubShell>
    );
  }
  
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <Link to="/tourhub" className="text-primary hover:underline flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Tour Hub
          </Link>
          <TourHubEmptyState variant="schedule" />
        </div>
      </TourHubShell>
    );
  }
  
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Tournament Details</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {tournament.venue_name && (
                  <div><dt className="text-muted-foreground">Venue</dt><dd className="font-medium">{tournament.venue_name}</dd></div>
                )}
                {tournament.venue_par && (
                  <div><dt className="text-muted-foreground">Par</dt><dd className="font-medium">{tournament.venue_par}</dd></div>
                )}
                {tournament.venue_yardage && (
                  <div><dt className="text-muted-foreground">Yardage</dt><dd className="font-medium">{tournament.venue_yardage.toLocaleString()}</dd></div>
                )}
                {tournament.defending_champion && (
                  <div><dt className="text-muted-foreground">Defending Champion</dt><dd className="font-medium">{tournament.defending_champion}</dd></div>
                )}
              </dl>
            </div>
          </div>
        );
      case 'leaderboard':
        return <TourHubEmptyState variant="leaderboard" />;
      case 'summary':
        return <TourHubEmptyState variant="summary" />;
      case 'tee-times':
        return <TourHubEmptyState variant="tee-times" />;
      case 'hole-stats':
        return <TourHubEmptyState variant="hole-stats" />;
      default:
        return null;
    }
  };
  
  return (
    <TourHubShell>
      <div className="pt-6">
        <Link to="/tourhub?tab=schedule" className="text-primary hover:underline flex items-center gap-1 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </Link>
        
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h1 className="text-xl font-bold text-foreground mb-2">{tournament.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
            </span>
            {tournament.venue_city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
              </span>
            )}
            {tournament.purse && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ${(tournament.purse / 1_000_000).toFixed(1)}M Purse
              </span>
            )}
          </div>
        </div>
        
        <TournamentDetailTabs activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
        
        <div className="pb-24">{renderTab()}</div>
      </div>
    </TourHubShell>
  );
}
