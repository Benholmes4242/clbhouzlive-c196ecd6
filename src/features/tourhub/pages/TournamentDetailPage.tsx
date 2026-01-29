import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, DollarSign, Trophy, Flag, Ruler, Globe, ChevronRight, BarChart3, Clock, FileText, Target } from 'lucide-react';
import { format } from 'date-fns';
import { TourHubShell } from '../components/TourHubShell';
import { TournamentDetailTabs, type TournamentDetailTab } from '../components/TourHubTabs';
import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import { usePlayerHeadshots } from '../hooks/usePlayerMedia';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { EventWinnerCard } from '../components/EventWinnerCard';
import { EventMomentsList } from '../components/EventMomentsList';
import { BatchPlayerAvatar } from '../components/PlayerAvatar';
import { cn } from '@/lib/utils';

// Valid tabs for deep linking
const VALID_TABS: TournamentDetailTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    inprogress: { bg: 'bg-green-500/20', text: 'text-green-600 dark:text-green-400', label: 'Live' },
    scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', label: 'Upcoming' },
    created: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Scheduled' },
    closed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Completed' },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// Format score relative to par with color coding
function ScoreToPar({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className={cn("text-muted-foreground", className)}>—</span>;
  
  const formatted = score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  const colorClass = score < 0 ? 'text-red-600 dark:text-red-400' : score > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-foreground';
  
  return <span className={cn(colorClass, "font-semibold", className)}>{formatted}</span>;
}

// Enhanced leaderboard row component
function LeaderboardRow({ 
  position, 
  positionTied,
  playerId,
  playerName, 
  playerPhotoUrl,
  score, 
  strokes,
  thru,
  money,
  status,
  isTop3 = false,
  headshotMap,
}: { 
  position: number; 
  positionTied?: boolean;
  playerId: string;
  playerName: string; 
  playerPhotoUrl?: string | null;
  score: number | null;
  strokes: number | null;
  thru: number | null;
  money: number | null;
  status?: string;
  isTop3?: boolean;
  headshotMap?: Map<string, string>;
}) {
  const positionColors: Record<number, string> = {
    1: 'text-amber-600 bg-amber-500/15',
    2: 'text-slate-500 bg-slate-200/50 dark:bg-slate-700/50',
    3: 'text-orange-700 bg-orange-500/15',
  };
  
  const isMissedCut = status === 'MC' || status === 'CUT';
  const isWithdrawn = status === 'WD' || status === 'DQ';
  const positionDisplay = positionTied ? `T${position}` : String(position);
  
  return (
    <Link
      to={`/tourhub/player/${playerId}`}
      className={cn(
        "flex items-center gap-3 sm:gap-4 py-3 px-3 rounded-lg transition-colors",
        "hover:bg-muted/50",
        isTop3 && "bg-muted/30",
        isMissedCut && "opacity-60"
      )}
    >
      {/* Position */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
        isTop3 ? positionColors[position] : "bg-muted/50 text-muted-foreground"
      )}>
        {isMissedCut ? 'MC' : isWithdrawn ? status : positionDisplay}
      </div>
      
      {/* Avatar */}
      <BatchPlayerAvatar
        playerId={playerId}
        playerName={playerName}
        fallbackPhotoUrl={playerPhotoUrl}
        headshotMap={headshotMap}
        size="sm"
      />
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          isTop3 ? "text-base" : "text-sm text-foreground"
        )}>
          {playerName}
        </p>
      </div>
      
      {/* Score to Par */}
      <div className="text-right shrink-0 w-12">
        <ScoreToPar score={score} className={isTop3 ? "text-base" : "text-sm"} />
      </div>
      
      {/* Thru (if available) */}
      {thru !== null && thru < 18 && (
        <div className="text-right shrink-0 w-10 hidden sm:block">
          <span className="text-xs text-muted-foreground">Thru {thru}</span>
        </div>
      )}
      
      {/* Total strokes */}
      {strokes && (
        <div className="text-right shrink-0 w-10 hidden sm:block">
          <span className="text-sm text-muted-foreground">{strokes}</span>
        </div>
      )}
      
      {/* Earnings */}
      {money && money > 0 && (
        <div className="text-right shrink-0 w-20 hidden md:block">
          <span className="text-xs text-emerald-600">${(money / 1000).toFixed(0)}K</span>
        </div>
      )}
    </Link>
  );
}

// Empty state component for tabs
function TabEmptyState({ variant }: { variant: 'leaderboard' | 'tee-times' | 'summary' | 'hole-stats' }) {
  const config: Record<string, { icon: typeof BarChart3; title: string; message: string }> = {
    leaderboard: {
      icon: BarChart3,
      title: 'Leaderboard Coming Soon',
      message: 'Leaderboard data will appear once the tournament begins.',
    },
    'tee-times': {
      icon: Clock,
      title: 'Tee Times Coming Soon',
      message: 'Tee times will be posted closer to the tournament.',
    },
    summary: {
      icon: FileText,
      title: 'Summary Coming Soon',
      message: 'Tournament summary will be available after completion.',
    },
    'hole-stats': {
      icon: Target,
      title: 'Hole Statistics Coming Soon',
      message: 'Hole-by-hole statistics will appear during play.',
    },
  };
  
  const c = config[variant] || config.leaderboard;
  const Icon = c.icon;
  
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{c.title}</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            {c.message}
          </p>
        </div>
      </div>
    </div>
  );
}

// Section header component
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide pl-3 border-l-3 border-primary">
        {title}
      </h3>
      {action && onAction && (
        <button 
          onClick={onAction}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {action}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // FIX 2: Tab deep linking - read initial tab from URL
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab') as TournamentDetailTab | null;
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  }, []);
  
  const [activeTab, setActiveTab] = useState<TournamentDetailTab>(initialTab);
  
  // FIX 2: Update URL when tab changes
  const handleTabChange = (tab: TournamentDetailTab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };
  
  const { data: tournament, isLoading } = useTourTournament(tournamentId || '');
  const { data: leaderboard } = useTourLeaderboard(tournamentId || '');
  
  // Get course image for hero background
  const venueInput = useMemo(() => {
    if (!tournament) return null;
    return {
      venueName: tournament.venue_name || tournament.name,
      venueCourseName: tournament.venue_course_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    };
  }, [tournament]);
  
  const { courseImage: courseMatch } = useSingleCourseImage(venueInput);
  
  // Extract player IDs for batch headshot fetching
  const playerIds = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard
      .map((entry: any) => entry.player?.id)
      .filter(Boolean) as string[];
  }, [leaderboard]);
  
  const { data: headshotMap } = usePlayerHeadshots(playerIds);
  
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
          <TabEmptyState variant="leaderboard" />
        </div>
      </TourHubShell>
    );
  }

  const hasLeaderboard = leaderboard && leaderboard.length > 0;
  const isCompleted = tournament.status === 'closed';
  const isLive = tournament.status === 'inprogress';
  
  // Format purse
  const formattedPurse = tournament.purse 
    ? `$${tournament.purse.toLocaleString()} ${tournament.currency || 'USD'}`
    : null;
  
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Event Winner (for completed tournaments) */}
            {isCompleted && tournamentId && (
              <EventWinnerCard tournamentId={tournamentId} />
            )}
            
            {/* Event Moments (for completed tournaments) */}
            {isCompleted && tournamentId && (
              <EventMomentsList tournamentId={tournamentId} limit={5} />
            )}
            
            {/* Course Info Card */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <SectionHeader title="Course" />
              <div className="flex items-start gap-4">
                {/* Course thumbnail */}
                {courseMatch?.imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img 
                      src={courseMatch.imageUrl} 
                      alt={tournament.venue_course_name || ''} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  {/* FIX 1: Course name linked */}
                  {tournament.venue_course_name && (
                    <Link 
                      to={courseMatch?.golfCourseId 
                        ? `/courses/${courseMatch.golfCourseId}` 
                        : `/courses?search=${encodeURIComponent(tournament.venue_course_name)}`}
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      {tournament.venue_course_name}
                    </Link>
                  )}
                  
                  {/* Par and Yardage */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {tournament.venue_par && (
                      <span className="flex items-center gap-1.5">
                        <Flag className="w-4 h-4" />
                        Par {tournament.venue_par}
                      </span>
                    )}
                    {tournament.venue_yardage && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4" />
                        {tournament.venue_yardage.toLocaleString()} yards
                      </span>
                    )}
                  </div>
                  
                  {/* Location */}
                  {(tournament.venue_city || tournament.venue_country) && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {[tournament.venue_city, tournament.venue_state, tournament.venue_country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tournament Details Grid */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <SectionHeader title="Tournament Details" />
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {tournament.venue_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Venue
                    </p>
                    <p className="text-sm font-medium text-foreground">{tournament.venue_name}</p>
                  </div>
                )}
                {formattedPurse && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Purse
                    </p>
                    <p className="text-sm font-medium text-foreground">{formattedPurse}</p>
                  </div>
                )}
                {tournament.defending_champion && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      Defending Champion
                    </p>
                    <p className="text-sm font-medium text-foreground">{tournament.defending_champion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Leaderboard Preview (if available) */}
            {hasLeaderboard && (
              <div className="bg-card rounded-xl border border-border/50 p-5">
                <SectionHeader 
                  title="Leaderboard" 
                  action="View Full Leaderboard" 
                  onAction={() => handleTabChange('leaderboard')} 
                />
                
                <div className="space-y-0 -mx-3">
                  {leaderboard.slice(0, 5).map((entry: any, index: number) => (
                    <LeaderboardRow
                      key={entry.id}
                      position={entry.position || index + 1}
                      positionTied={entry.position_tied}
                      playerId={entry.player?.id || ''}
                      playerName={entry.player?.full_name || 'Unknown'}
                      playerPhotoUrl={entry.player?.photo_url}
                      score={entry.score}
                      strokes={entry.strokes}
                      thru={entry.thru}
                      money={entry.money}
                      status={entry.status}
                      isTop3={index < 3}
                      headshotMap={headshotMap}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'leaderboard':
        if (!hasLeaderboard) {
          return <TabEmptyState variant="leaderboard" />;
        }
        return (
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 sm:gap-4 py-3 px-3 bg-muted/30 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="w-10 shrink-0 text-center">Pos</div>
              <div className="w-8 shrink-0"></div> {/* Avatar */}
              <div className="flex-1">Player</div>
              <div className="w-12 text-right shrink-0">To Par</div>
              <div className="w-10 text-right shrink-0 hidden sm:block">Thru</div>
              <div className="w-10 text-right shrink-0 hidden sm:block">Total</div>
              <div className="w-20 text-right shrink-0 hidden md:block">Earnings</div>
            </div>
            
            {/* Leaderboard rows */}
            <div className="divide-y divide-border/20">
              {leaderboard.map((entry: any, index: number) => (
                <LeaderboardRow
                  key={entry.id}
                  position={entry.position || index + 1}
                  positionTied={entry.position_tied}
                  playerId={entry.player?.id || ''}
                  playerName={entry.player?.full_name || 'Unknown'}
                  playerPhotoUrl={entry.player?.photo_url}
                  score={entry.score}
                  strokes={entry.strokes}
                  thru={entry.thru}
                  money={entry.money}
                  status={entry.status}
                  isTop3={index < 3}
                  headshotMap={headshotMap}
                />
              ))}
            </div>
          </div>
        );
      
      case 'summary':
        return <TabEmptyState variant="summary" />;
      case 'tee-times':
        return <TabEmptyState variant="tee-times" />;
      case 'hole-stats':
        return <TabEmptyState variant="hole-stats" />;
      default:
        return null;
    }
  };
  
  return (
    <TourHubShell>
      <div className="pt-6 pb-24">
        {/* Back Link */}
        <Link to="/tourhub?tab=schedule" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Schedule
        </Link>
        
        {/* Hero Section with Gradient/Image Background */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          {/* Background - course image if available, otherwise gradient */}
          {courseMatch?.imageUrl ? (
            <>
              <div className="absolute inset-0">
                <img 
                  src={courseMatch.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-slate-900/40" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            </>
          )}
          
          <div className="relative px-6 py-10">
            {/* Top: Title + Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{tournament.name}</h1>
                
                {/* Meta Strip */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
                  </span>
                  
                  {tournament.venue_city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  
                  {formattedPurse && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      {formattedPurse}
                    </span>
                  )}
                </div>
              </div>
              
              <StatusBadge status={tournament.status} />
            </div>
            
            {/* Course Info Strip */}
            {(tournament.venue_course_name || tournament.venue_par || tournament.venue_yardage) && (
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10">
                {tournament.venue_course_name && (
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">{tournament.venue_course_name}</span>
                  </div>
                )}
                {tournament.venue_par && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Par</span>
                    <span className="text-sm font-medium text-white">{tournament.venue_par}</span>
                  </div>
                )}
                {tournament.venue_yardage && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">{tournament.venue_yardage.toLocaleString()} yards</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <TournamentDetailTabs activeTab={activeTab} onTabChange={handleTabChange} className="mb-6" />
        
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
