import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, GraduationCap, Building, Award, Trophy, Globe, TrendingUp, Zap, Target, Activity, Ruler, Scale, User, ChevronUp, ChevronDown } from 'lucide-react';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { PlayerSkillTreeCard } from '../components/player';
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

// FIX 2: Format height from inches to feet'inches"
function formatHeight(inches: string | number | null | undefined): string {
  if (!inches) return '—';
  const totalInches = typeof inches === 'string' ? parseInt(inches, 10) : inches;
  if (isNaN(totalInches)) return '—';
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches % 12;
  return `${feet}'${remainingInches}"`;
}

// FIX 2: Format weight with lbs unit
function formatWeight(weight: string | number | null | undefined): string {
  if (!weight) return '—';
  const weightNum = typeof weight === 'string' ? parseInt(weight, 10) : weight;
  if (isNaN(weightNum)) return '—';
  return `${weightNum} lbs`;
}

// Enhanced stat card for hero section
function HeroStat({ label, value, icon: Icon, highlight = false, iconEmoji }: { 
  label: string; 
  value: string | number | null; 
  icon?: typeof Trophy;
  highlight?: boolean;
  iconEmoji?: string;
}) {
  const hasValue = value !== null && value !== '—' && value !== undefined;
  
  return (
    <div className={cn(
      "text-center px-3 py-4 rounded-xl transition-all",
      highlight && hasValue 
        ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20" 
        : "bg-muted/50 border border-border/50"
    )}>
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        {iconEmoji && <span className="text-sm">{iconEmoji}</span>}
        {Icon && !iconEmoji && <Icon className={cn("w-3.5 h-3.5", highlight ? "text-amber-500" : "text-muted-foreground")} />}
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
      </div>
      <div className={cn(
        "text-2xl font-bold",
        hasValue ? (highlight ? "text-amber-500" : "text-foreground") : "text-muted-foreground"
      )}>
        {hasValue ? value : '—'}
      </div>
    </div>
  );
}

// Performance stat row with optional trend indicator
function StatGridRow({ label, value, trend }: { label: string; value: string; trend?: 'positive' | 'negative' | null }) {
  const hasValue = value !== '—';
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/20 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {trend === 'positive' && <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />}
        {trend === 'negative' && <ChevronDown className="w-3.5 h-3.5 text-red-500" />}
        <span className={cn(
          "text-sm font-medium",
          hasValue ? (
            trend === 'positive' ? "text-emerald-500" : 
            trend === 'negative' ? "text-red-500" : 
            "text-foreground"
          ) : "text-muted-foreground"
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}

// Section header component for consistency
function SectionHeader({ icon: Icon, title, iconEmoji }: { icon?: typeof Trophy; title: string; iconEmoji?: string }) {
  return (
    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 pl-3 border-l-3 border-primary">
      {iconEmoji && <span className="text-lg">{iconEmoji}</span>}
      {Icon && !iconEmoji && <Icon className="w-5 h-5 text-primary" />}
      {title}
    </h2>
  );
}

// Recent tournament result item - with enhanced styling
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
  // Determine position styling
  const isWin = position === '1st' || position === 'T1st';
  const isTop10 = position.startsWith('T') ? parseInt(position.slice(1)) <= 10 : parseInt(position) <= 10;
  const isCut = position === 'MC' || position === 'WD' || position === 'DQ';
  
  const positionColor = isWin 
    ? 'text-amber-500 font-bold' 
    : isTop10
      ? 'text-emerald-500 font-semibold'
      : isCut
        ? 'text-muted-foreground'
        : 'text-foreground font-medium';

  return (
    <Link 
      to={`/tourhub/tournament/${tournamentId}`}
      className={cn(
        "flex items-center gap-4 py-3 px-3 rounded-lg",
        "bg-card/50 border border-border/30",
        "hover:border-primary/40 hover:bg-card transition-all duration-200",
        "group"
      )}
    >
      {/* Position badge */}
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
        isWin ? "bg-amber-500/20 text-amber-500" :
        isTop10 ? "bg-emerald-500/10 text-emerald-500" :
        isCut ? "bg-muted/50 text-muted-foreground" :
        "bg-muted/30 text-foreground"
      )}>
        {position}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-foreground">{score}</p>
        {earnings !== '—' && (
          <p className="text-xs text-emerald-500 mt-0.5">{earnings}</p>
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

  // DEBUG LOGGING
  useEffect(() => {
    if (playerId && playerStats) {
      console.log('[PlayerProfilePage] Render stats snapshot', {
        playerId,
        playerName: player?.full_name,
        wins: playerStats.wins,
        fedex_rank: playerStats.fedex_rank,
        world_rank: playerStats.world_rank,
        events_played: playerStats.events_played,
      });
    }
  }, [playerId, player, playerStats, allStats]);

  // Photo URL resolution with correct priority
  const photoUrl = useMemo(() => {
    const primaryUrl = resolvePhotoUrl(player?.photo_url);
    if (primaryUrl) return primaryUrl;
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
          <div className="h-64 bg-muted rounded-2xl" />
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
        <Link to="/tourhub?tab=players" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Players
        </Link>
        
        {/* Hero Section with White Background */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm">
          <div className="relative px-6 py-10">
            {/* Top row: Avatar + Name + World Rank */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                {/* Larger avatar with ring */}
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-primary/40 ring-offset-4 ring-offset-card shadow-xl">
                    {photoUrl && !imageError ? (
                      <img 
                        src={photoUrl} 
                        alt={player.full_name}
                        className="w-full h-full object-cover object-top"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <span className="text-4xl font-bold text-muted-foreground">{initials}</span>
                    )}
                  </div>
                </div>
                
                {/* Name + Country + Age */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{player.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                    {player.country && (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        {player.country.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                      </span>
                    )}
                    {age && (
                      <span className="text-sm text-muted-foreground">Age {age}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* World Rank Badge */}
              {playerStats?.world_rank && playerStats.world_rank > 0 && (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">World Rank</span>
                  <span className="text-xl font-bold text-primary">#{playerStats.world_rank}</span>
                </div>
              )}
            </div>
            
            {/* Stats Strip with Enhanced Styling */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <HeroStat 
                label="World Rank" 
                value={playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : null}
                iconEmoji="🌍"
              />
              <HeroStat 
                label="FedEx Rank" 
                value={playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : null}
                iconEmoji="⚡"
              />
              <HeroStat 
                label="Season Wins" 
                value={playerStats?.wins && playerStats.wins > 0 ? playerStats.wins : 0}
                iconEmoji="🏆"
                highlight={!!(playerStats?.wins && playerStats.wins > 0)}
              />
              <HeroStat 
                label="Events" 
                value={playerStats?.events_played ?? null}
                iconEmoji="📅"
              />
            </div>
          </div>
        </div>
        
        {/* Body: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Grid */}
            {playerStats ? (
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <SectionHeader icon={TrendingUp} title="Season Performance" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                  {/* Left Column: Performance */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-medium flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5" />
                      Performance
                    </p>
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-medium flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" />
                      Ball Striking & Short Game
                    </p>
                    <StatGridRow label="Scoring Average" value={formatStat(playerStats.scoring_average, 'decimal')} />
                    <StatGridRow label="Driving Distance" value={formatStat(playerStats.driving_distance, 'yards')} />
                    <StatGridRow label="Driving Accuracy" value={formatStat(playerStats.driving_accuracy, 'percent')} />
                    <StatGridRow label="Greens in Regulation" value={formatStat(playerStats.greens_in_reg, 'percent')} />
                    <StatGridRow label="Putting Average" value={playerStats.putting_average ? playerStats.putting_average.toFixed(3) : '—'} />
                    <StatGridRow label="Sand Saves" value={formatStat(playerStats.sand_saves, 'percent')} />
                    <StatGridRow label="Scrambling" value={formatStat(playerStats.scrambling, 'percent')} />
                  </div>
                </div>
                
                {/* FIX 5: Advanced Stats Section with Visual Indicators */}
                {(playerStats.strokes_gained_total !== null || playerStats.birdies_per_round !== null) && (
                  <div className="mt-6 pt-6 border-t border-border/30">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-medium flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Advanced Stats
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <div>
                        <StatGridRow 
                          label="Strokes Gained Total" 
                          value={formatStat(playerStats.strokes_gained_total, 'signed')} 
                          trend={playerStats.strokes_gained_total !== null 
                            ? (playerStats.strokes_gained_total > 0 ? 'positive' : playerStats.strokes_gained_total < 0 ? 'negative' : null)
                            : null
                          }
                        />
                        <StatGridRow 
                          label="Birdies per Round" 
                          value={formatStat(playerStats.birdies_per_round, 'decimal')} 
                        />
                      </div>
                      <div>
                        {/* Additional advanced stats placeholder */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center bg-card rounded-xl border border-border/50">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Season statistics loading</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Stats will appear once the data feed includes this player.
                </p>
              </div>
            )}
            
            {/* Skill Build Card - Pro Dashboard V1 */}
            {playerId && (
              <PlayerSkillTreeCard playerId={playerId} />
            )}
            
            {/* Recent Tournaments */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <SectionHeader icon={Activity} title="Recent Tournaments" />
              
              {resultsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : playerResults && playerResults.length > 0 ? (
                <div className="space-y-2">
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
                // FIX 6: Enhanced empty state
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⛳</span>
                  </div>
                  <p className="text-muted-foreground font-medium">No tournament results yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Results will appear as tournaments are completed
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* FIX 7: Player Info with Grouping */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Player Info
              </h2>
              
              <div className="space-y-5">
                {/* Personal Info Group */}
                {(player.birth_date || player.birth_place || player.residence) && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">Personal</p>
                    
                    {player.birth_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-xs">Birth Date</p>
                          <p className="text-foreground text-sm">{new Date(player.birth_date).toLocaleDateString('en-US', { 
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
                          <p className="text-foreground text-sm">{player.birth_place}</p>
                        </div>
                      </div>
                    )}
                    
                    {player.residence && (
                      <div className="flex items-start gap-3">
                        <Building className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-xs">Residence</p>
                          <p className="text-foreground text-sm">{player.residence}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Divider */}
                {(player.birth_date || player.birth_place || player.residence) && 
                 (player.college || player.turned_pro || player.height || player.weight) && (
                  <div className="border-t border-border/30" />
                )}
                
                {/* Golf Career Group */}
                {(player.college || player.turned_pro || player.height || player.weight) && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">Golf Career</p>
                    
                    {player.college && (
                      <div className="flex items-start gap-3">
                        <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-xs">College</p>
                          <Link 
                            to={`/tourhub?tab=college-golf`}
                            className="text-primary hover:underline text-sm font-medium"
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
                          <p className="text-foreground text-sm">{player.turned_pro}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* FIX 2: Height with proper formatting */}
                    {player.height && (
                      <div className="flex items-start gap-3">
                        <Ruler className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-xs">Height</p>
                          <p className="text-foreground text-sm">{formatHeight(player.height)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* FIX 2: Weight with proper formatting */}
                    {player.weight && (
                      <div className="flex items-start gap-3">
                        <Scale className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-muted-foreground text-xs">Weight</p>
                          <p className="text-foreground text-sm">{formatWeight(player.weight)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* If no info at all */}
                {!player.birth_date && !player.birth_place && !player.residence && !player.college && !player.turned_pro && !player.height && !player.weight && (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    No additional info available.
                  </p>
                )}
              </div>
            </div>
            
            {/* Data Source - Subtle footer */}
            <div className="px-4 py-3 rounded-lg bg-muted/30 border border-border/30">
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
