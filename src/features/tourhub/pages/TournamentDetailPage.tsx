import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, DollarSign, Trophy, Flag, Users, Ruler, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { TourHubShell } from '../components/TourHubShell';
import { TournamentDetailTabs, type TournamentDetailTab } from '../components/TourHubTabs';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    inprogress: { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400', label: 'Live' },
    scheduled: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', label: 'Upcoming' },
    created: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-muted-foreground', label: 'Scheduled' },
    closed: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-muted-foreground', label: 'Completed' },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// Leaderboard row component
function LeaderboardRow({ 
  position, 
  playerName, 
  score, 
  toPar, 
  isTop3 = false 
}: { 
  position: number; 
  playerName: string; 
  score: number | string; 
  toPar: string;
  isTop3?: boolean;
}) {
  const positionColors: Record<number, string> = {
    1: 'text-amber-600 bg-amber-500/10',
    2: 'text-slate-500 bg-slate-200/50 dark:bg-slate-700/50',
    3: 'text-orange-700 bg-orange-500/10',
  };
  
  return (
    <div className={cn(
      "flex items-center gap-4 py-3 border-b border-border/30 last:border-0",
      isTop3 && "py-4"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
        isTop3 ? positionColors[position] : "text-muted-foreground"
      )}>
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          isTop3 ? "text-base" : "text-sm text-foreground"
        )}>
          {playerName}
        </p>
      </div>
      <div className="text-right">
        <span className={cn(
          "font-semibold",
          isTop3 ? "text-base" : "text-sm"
        )}>
          {toPar}
        </span>
      </div>
    </div>
  );
}

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [activeTab, setActiveTab] = useState<TournamentDetailTab>('overview');
  const { data: tournament, isLoading } = useTourTournament(tournamentId || '');
  const { data: leaderboard } = useTourLeaderboard(tournamentId || '');
  
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="animate-pulse space-y-4 pt-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-10 bg-muted rounded-lg w-96" />
          <div className="h-64 bg-muted rounded-xl" />
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

  const hasLeaderboard = leaderboard && leaderboard.length > 0;
  
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Tournament Details - Background first */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Tournament Details</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {tournament.venue_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Venue</p>
                    <p className="text-sm font-medium text-foreground">{tournament.venue_name}</p>
                  </div>
                )}
                {tournament.venue_course_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Course</p>
                    <p className="text-sm font-medium text-foreground">{tournament.venue_course_name}</p>
                  </div>
                )}
                {(tournament.venue_city || tournament.venue_state || tournament.venue_country) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-sm font-medium text-foreground">
                      {[tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {tournament.venue_par && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Par</p>
                    <p className="text-sm font-medium text-foreground">{tournament.venue_par}</p>
                  </div>
                )}
                {tournament.venue_yardage && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Yardage</p>
                    <p className="text-sm font-medium text-foreground">{tournament.venue_yardage.toLocaleString()}</p>
                  </div>
                )}
                {tournament.purse && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Purse</p>
                    <p className="text-sm font-medium text-foreground">
                      ${(tournament.purse / 1_000_000).toFixed(1)}M {tournament.currency || 'USD'}
                    </p>
                  </div>
                )}
                {tournament.defending_champion && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Defending Champion</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      {tournament.defending_champion}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Leaderboard Preview (if available) */}
            {hasLeaderboard && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Leaderboard</h3>
                  <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className="text-xs text-primary hover:underline"
                  >
                    View Full Leaderboard
                  </button>
                </div>
                
                <div className="space-y-0">
                  {leaderboard.slice(0, 5).map((entry: any, index: number) => (
                    <LeaderboardRow
                      key={entry.id}
                      position={entry.position || index + 1}
                      playerName={entry.player?.full_name || 'Unknown'}
                      score={entry.total || '—'}
                      toPar={entry.score_to_par != null ? (entry.score_to_par > 0 ? `+${entry.score_to_par}` : entry.score_to_par === 0 ? 'E' : String(entry.score_to_par)) : '—'}
                      isTop3={index < 3}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'leaderboard':
        if (!hasLeaderboard) {
          return <TourHubEmptyState variant="leaderboard" />;
        }
        return (
          <div>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {leaderboard.slice(0, 3).map((entry: any, index: number) => {
                const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
                const actualIndex = podiumOrder[index];
                const actualEntry = leaderboard[actualIndex];
                if (!actualEntry) return null;
                
                const isFirst = actualIndex === 0;
                const bgColors = ['bg-amber-500/10', 'bg-slate-200/50 dark:bg-slate-700/50', 'bg-orange-500/10'];
                const textColors = ['text-amber-600', 'text-slate-500', 'text-orange-700'];
                
                return (
                  <div 
                    key={actualEntry.id}
                    className={cn(
                      "text-center p-4 rounded-xl",
                      bgColors[actualIndex],
                      isFirst && "transform scale-105"
                    )}
                  >
                    <div className={cn(
                      "text-2xl font-bold mb-2",
                      textColors[actualIndex]
                    )}>
                      #{actualIndex + 1}
                    </div>
                    <p className="font-semibold text-foreground truncate">
                      {(actualEntry as any).player?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(actualEntry as any).total != null ? (actualEntry as any).total : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {/* Rest of field */}
            {leaderboard.length > 3 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-medium">Rest of Field</p>
                <div className="space-y-0">
                  {leaderboard.slice(3).map((entry: any, index: number) => (
                    <LeaderboardRow
                      key={entry.id}
                      position={entry.position || index + 4}
                      playerName={(entry.player as any)?.full_name || 'Unknown'}
                      score={entry.total || '—'}
                      toPar={entry.score_to_par != null ? (entry.score_to_par > 0 ? `+${entry.score_to_par}` : entry.score_to_par === 0 ? 'E' : String(entry.score_to_par)) : '—'}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
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
      <div className="pt-6 pb-24">
        {/* Back Link */}
        <Link to="/tourhub?tab=schedule" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </Link>
        
        {/* Hero Section - Background First */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-background rounded-2xl -z-10" />
          
          <div className="px-6 py-8">
            {/* Top: Title + Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{tournament.name}</h1>
              <StatusBadge status={tournament.status} />
            </div>
            
            {/* Meta Strip */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
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
            
            {/* Course Meta Strip */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/30">
              {tournament.venue_course_name && (
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{tournament.venue_course_name}</span>
                </div>
              )}
              {tournament.venue_par && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Par</span>
                  <span className="text-sm font-medium text-foreground">{tournament.venue_par}</span>
                </div>
              )}
              {tournament.venue_yardage && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{tournament.venue_yardage.toLocaleString()} yards</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <TournamentDetailTabs activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
        
        {/* Tab Content */}
        {renderTab()}
        
        {/* Data source footer */}
        <div className="mt-12 pt-6 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="w-3.5 h-3.5" />
          <span>Powered by SportsRadar</span>
        </div>
      </div>
    </TourHubShell>
  );
}
