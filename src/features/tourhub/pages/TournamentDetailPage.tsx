import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, DollarSign, Trophy, Flag, Info } from 'lucide-react';
import { format } from 'date-fns';
import { TourHubShell } from '../components/TourHubShell';
import { TournamentDetailTabs, type TournamentDetailTab } from '../components/TourHubTabs';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourTournament } from '../hooks/useTourHubData';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    inprogress: { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400', label: 'Live' },
    scheduled: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', label: 'Scheduled' },
    created: { bg: 'bg-gray-500/10', text: 'text-muted-foreground', label: 'Created' },
    closed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Completed' },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [activeTab, setActiveTab] = useState<TournamentDetailTab>('overview');
  const { data: tournament, isLoading } = useTourTournament(tournamentId || '');
  
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="animate-pulse space-y-4 pt-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-36 bg-muted rounded-xl" />
          <div className="h-10 bg-muted rounded-lg w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-48 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </TourHubShell>
    );
  }
  
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <Link to="/tourhub?tab=schedule" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Schedule
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Tournament Details</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {tournament.venue_name && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Venue</p>
                      <p className="font-medium text-foreground">{tournament.venue_name}</p>
                    </div>
                  )}
                  {tournament.venue_course_name && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Course</p>
                      <p className="font-medium text-foreground">{tournament.venue_course_name}</p>
                    </div>
                  )}
                  {(tournament.venue_city || tournament.venue_state || tournament.venue_country) && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">
                        {[tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {tournament.venue_par && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Par</p>
                      <p className="font-medium text-foreground">{tournament.venue_par}</p>
                    </div>
                  )}
                  {tournament.venue_yardage && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Yardage</p>
                      <p className="font-medium text-foreground">{tournament.venue_yardage.toLocaleString()}</p>
                    </div>
                  )}
                  {tournament.defending_champion && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-muted-foreground">Defending Champion</p>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        {tournament.defending_champion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Facts</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Flag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <StatusBadge status={tournament.status} />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(tournament.start_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(tournament.end_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {tournament.purse && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-muted-foreground">Purse</p>
                        <p className="font-medium text-foreground">
                          ${tournament.purse.toLocaleString()} {tournament.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
      <div className="pt-6 pb-[var(--page-bottom-padding)]">
        {/* Back Link */}
        <Link to="/tourhub?tab=schedule" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </Link>
        
        {/* Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-foreground">{tournament.name}</h1>
            <StatusBadge status={tournament.status} />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
            </span>
            
            {tournament.venue_city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
              </span>
            )}
            
            {tournament.purse && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                ${(tournament.purse / 1_000_000).toFixed(1)}M Purse
              </span>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <TournamentDetailTabs activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
        
        {/* Tab Content */}
        {renderTab()}
      </div>
    </TourHubShell>
  );
}
