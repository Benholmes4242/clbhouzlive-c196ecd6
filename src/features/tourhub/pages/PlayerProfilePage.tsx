import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, GraduationCap, Building, Award, Trophy, Globe, TrendingUp, Zap, Target, Flag, Activity, Ruler, Scale } from 'lucide-react';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourPlayer, useTourPlayerStatistics, useTourSeason } from '../hooks/useTourHubData';
import { usePlayerHeadshot } from '../hooks/usePlayerMedia';
import { usePlayerResults, formatPosition, formatScore, formatMoney } from '../hooks/usePlayerResults';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Helper to format numbers consistently
function formatStat(value: number | null | undefined, formatType?: 'decimal' | 'percent' | 'yards' | 'currency' | 'signed'): string {
  if (value === null || value === undefined) return '—';
  switch (formatType) {
    case 'decimal':
      return value.toFixed(2);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'yards':
      return `${value.toFixed(1)} yds`;
    case 'currency':
      return value >= 1_000_000 
        ? `$${(value / 1_000_000).toFixed(2)}M`
        : `$${value.toLocaleString()}`;
    case 'signed':
      if (value === 0) return '0.00';
      return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    default:
      return String(value);
  }
}

// Stat card for hero section
function HeroStat({ label, value, icon: Icon, highlight = false }: { 
  label: string; 
  value: string | number | null; 
  icon?: typeof Trophy;
  highlight?: boolean;
}) {
  const hasValue = value !== null && value !== '—' && value !== undefined;
  
  return (
    <div className={cn(
      "text-center px-4 py-3",
      highlight && hasValue && "bg-amber-500/10 rounded-lg"
    )}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {Icon && <Icon className={cn("w-3.5 h-3.5", highlight ? "text-amber-600" : "text-muted-foreground")} />}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn(
        "text-xl font-bold",
        hasValue ? (highlight ? "text-amber-600" : "text-foreground") : "text-muted-foreground"
      )}>
        {hasValue ? value : '—'}
      </div>
    </div>
  );
}

// Performance stat row
function StatGridRow({ label, value }: { label: string; value: string }) {
  const hasValue = value !== '—';
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", hasValue ? "text-foreground" : "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

// Recent tournament result item - now with links
function TournamentResultItem({ 
  tournamentId,
  name, 
  position, 
  score, 
  earnings,
  date 
}: { 
  tournamentId: string;
  name: string; 
  position: string; 
  score: string;
  earnings: string;
  date: string;
}) {
  // Determine position color
  const positionColor = position === '1st' || position === 'T1st' 
    ? 'text-amber-600 dark:text-amber-500' 
    : position.startsWith('T') && parseInt(position.slice(1)) <= 10
      ? 'text-emerald-600 dark:text-emerald-500'
      : position === 'MC' || position === 'WD' || position === 'DQ'
        ? 'text-muted-foreground'
        : 'text-foreground';

  return (
    <Link 
      to={`/tourhub/tournament/${tournamentId}`}
      className="flex items-center gap-4 py-3 border-l-2 border-border/50 pl-4 hover:border-primary/50 hover:bg-muted/30 transition-colors -mx-2 px-2 rounded-r-lg group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{name}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <div className="text-right flex items-center gap-4">
        <span className={cn("text-sm font-semibold", positionColor)}>{position}</span>
        <span className="text-sm text-muted-foreground w-12 text-right">{score}</span>
        {earnings !== '—' && (
          <span className="text-xs text-emerald-600 dark:text-emerald-500 w-20 text-right">{earnings}</span>
        )}
      </div>
    </Link>
  );
}

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const [imageError, setImageError] = useState(false);
  
  const { data: player, isLoading: playerLoading } = useTourPlayer(playerId || '');
  const { data: headshot } = usePlayerHeadshot(playerId);
  const { data: season } = useTourSeason();
  const { data: allStats } = useTourPlayerStatistics(season?.id);
  const { data: playerResults, isLoading: resultsLoading } = usePlayerResults(playerId, 10);
  
  // Find this player's stats
  const playerStats = useMemo(() => {
    if (!allStats || !playerId) return null;
    return allStats.find(s => s.player_id === playerId) || null;
  }, [allStats, playerId]);

  // DEBUG LOGGING - Render-time stats snapshot
  useEffect(() => {
    if (playerId && playerStats) {
      console.log('[PlayerProfilePage] Render stats snapshot', {
        playerId,
        playerName: player?.full_name,
        wins: playerStats.wins,
        fedex_rank: playerStats.fedex_rank,
        world_rank: playerStats.world_rank,
        events_played: playerStats.events_played,
        raw: playerStats,
      });
    } else if (playerId && allStats && allStats.length > 0) {
      console.log('[PlayerProfilePage] Stats NOT found for player', {
        playerId,
        allStatsCount: allStats.length,
        samplePlayerIds: allStats.slice(0, 3).map(s => s.player_id),
      });
    }
  }, [playerId, player, playerStats, allStats]);

  // FIX 1: Photo URL resolution with correct priority
  // Priority: sr_players.photo_url (resolved) > player_media.headshot_url (resolved, no ui-avatars) > null
  const photoUrl = useMemo(() => {
    // First try sr_players.photo_url
    const primaryUrl = resolvePhotoUrl(player?.photo_url);
    if (primaryUrl) return primaryUrl;
    
    // Fall back to player_media headshot (resolvePhotoUrl already filters ui-avatars)
    const secondaryUrl = resolvePhotoUrl(headshot);
    if (secondaryUrl) return secondaryUrl;
    
    return null;
  }, [player?.photo_url, headshot]);
  
  const isLoading = playerLoading;
  
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="pt-6 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </TourHubShell>
    );
  }
  
  if (!player) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <Link to="/tourhub?tab=players" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Players
          </Link>
          <TourHubEmptyState variant="players" />
        </div>
      </TourHubShell>
    );
  }
  
  const initials = player.full_name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Calculate age if birth_date exists
  const age = player.birth_date 
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  
  return (
    <TourHubShell>
      <div className="pt-6 pb-24">
        {/* Back Link */}
        <Link to="/tourhub?tab=players" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Players
        </Link>
        
        {/* Hero Section - Background First */}
        <div className="relative mb-8">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-background rounded-2xl -z-10" />
          
          <div className="px-6 py-8">
            {/* Top row: Avatar + Name + World Rank */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-5">
                {/* Avatar with proper photo resolution */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg">
                    {photoUrl && !imageError ? (
                      <img 
                        src={photoUrl} 
                        alt={player.full_name}
                        className="w-24 h-24 object-cover object-top"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-slate-400">{initials}</span>
                    )}
                  </div>
                </div>
                
                {/* Name + Country + Age */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{player.full_name}</h1>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {player.country && (
                      <span className="flex items-center gap-1.5">
                        <Flag className="w-4 h-4" />
                        {player.country.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                      </span>
                    )}
                    {age && (
                      <span className="text-sm">Age {age}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* World Rank Badge */}
              {playerStats?.world_rank && playerStats.world_rank > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 rounded-full">
                  <Globe className="w-4 h-4 text-white dark:text-slate-900" />
                  <span className="text-sm font-medium text-white dark:text-slate-900">World Rank</span>
                  <span className="text-lg font-bold text-white dark:text-slate-900">#{playerStats.world_rank}</span>
                </div>
              )}
            </div>
            
            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 border-t border-border/30 pt-6">
              <HeroStat 
                label="World Rank" 
                value={playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : null}
                icon={Globe}
              />
              <HeroStat 
                label="FedEx Rank" 
                value={playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : null}
                icon={Zap}
              />
              <HeroStat 
                label="Season Wins" 
                value={playerStats?.wins && playerStats.wins > 0 ? playerStats.wins : 0}
                icon={Trophy}
                highlight={!!(playerStats?.wins && playerStats.wins > 0)}
              />
              <HeroStat 
                label="Events" 
                value={playerStats?.events_played ?? null}
                icon={Activity}
              />
            </div>
          </div>
        </div>
        
        {/* Body: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Grid - Background Rows */}
            {playerStats ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Season Performance
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  {/* Left Column: Performance */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium">Performance</p>
                    <StatGridRow label="Events Played" value={formatStat(playerStats.events_played)} />
                    <StatGridRow label="Cuts Made" value={formatStat(playerStats.cuts_made)} />
                    <StatGridRow label="Wins" value={formatStat(playerStats.wins)} />
                    <StatGridRow label="Top 10s" value={formatStat(playerStats.top_10s)} />
                    <StatGridRow label="Top 25s" value={formatStat(playerStats.top_25s)} />
                    <StatGridRow label="Earnings" value={formatStat(playerStats.earnings, 'currency')} />
                    <StatGridRow label="FedEx Points" value={formatStat(playerStats.fedex_points)} />
                  </div>
                  
                  {/* Right Column: Ball Striking & Short Game */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium">Ball Striking & Short Game</p>
                    <StatGridRow label="Scoring Average" value={formatStat(playerStats.scoring_average, 'decimal')} />
                    <StatGridRow label="Driving Distance" value={formatStat(playerStats.driving_distance, 'yards')} />
                    <StatGridRow label="Driving Accuracy" value={formatStat(playerStats.driving_accuracy, 'percent')} />
                    <StatGridRow label="Greens in Regulation" value={formatStat(playerStats.greens_in_reg, 'percent')} />
                    <StatGridRow label="Putting Average" value={playerStats.putting_average ? playerStats.putting_average.toFixed(3) : '—'} />
                    <StatGridRow label="Sand Saves" value={formatStat(playerStats.sand_saves, 'percent')} />
                    <StatGridRow label="Scrambling" value={formatStat(playerStats.scrambling, 'percent')} />
                  </div>
                </div>
                
                {/* FIX 4: Advanced Stats Section */}
                {(playerStats.strokes_gained_total !== null || playerStats.birdies_per_round !== null) && (
                  <div className="mt-6 pt-4 border-t border-border/30">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium">Advanced Stats</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                      <div>
                        <StatGridRow label="Strokes Gained Total" value={formatStat(playerStats.strokes_gained_total, 'signed')} />
                        <StatGridRow label="Birdies per Round" value={formatStat(playerStats.birdies_per_round, 'decimal')} />
                      </div>
                      <div>
                        {/* Additional advanced stats can be added here */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Season statistics loading</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Stats will appear once the data feed includes this player.
                </p>
              </div>
            )}
            
            {/* FIX 2: Recent Tournaments - Player-Specific Results */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Recent Tournaments
              </h2>
              
              {resultsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : playerResults && playerResults.length > 0 ? (
                <div className="space-y-0">
                  {playerResults.map((result) => (
                    <TournamentResultItem
                      key={result.id}
                      tournamentId={result.tournament_id}
                      name={result.tournament_name}
                      position={formatPosition(result.position, result.position_tied, result.status)}
                      score={formatScore(result.score)}
                      earnings={formatMoney(result.money)}
                      date={result.tournament_end_date 
                        ? format(new Date(result.tournament_end_date), 'MMM d, yyyy')
                        : '—'
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-border/50 rounded-lg">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No tournament results available yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Results will appear as tournaments are completed
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Player Info - Clean rows, no card */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Player Info</h2>
              
              <div className="space-y-4 text-sm">
                {player.birth_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Birth Date</p>
                      <p className="text-foreground">{new Date(player.birth_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                )}
                
                {player.birth_place && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Birth Place</p>
                      <p className="text-foreground">{player.birth_place}</p>
                    </div>
                  </div>
                )}
                
                {player.residence && (
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Residence</p>
                      <p className="text-foreground">{player.residence}</p>
                    </div>
                  </div>
                )}
                
                {/* FIX 3a: College with link */}
                {player.college && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">College</p>
                      <Link 
                        to={`/tourhub?tab=college-golf`}
                        className="text-primary hover:underline"
                      >
                        {player.college}
                      </Link>
                    </div>
                  </div>
                )}
                
                {player.turned_pro && (
                  <div className="flex items-start gap-3">
                    <Award className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Turned Pro</p>
                      <p className="text-foreground">{player.turned_pro}</p>
                    </div>
                  </div>
                )}
                
                {/* FIX 4: Height & Weight if available */}
                {player.height && (
                  <div className="flex items-start gap-3">
                    <Ruler className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Height</p>
                      <p className="text-foreground">{player.height}</p>
                    </div>
                  </div>
                )}
                
                {player.weight && (
                  <div className="flex items-start gap-3">
                    <Scale className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">Weight</p>
                      <p className="text-foreground">{player.weight}</p>
                    </div>
                  </div>
                )}
                
                {/* If no info at all */}
                {!player.birth_date && !player.birth_place && !player.residence && !player.college && !player.turned_pro && (
                  <p className="text-muted-foreground text-center py-4">
                    No additional info available.
                  </p>
                )}
              </div>
            </div>
            
            {/* Data Source - Subtle footer */}
            <div className="pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                <span>Powered by SportsRadar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TourHubShell>
  );
}
