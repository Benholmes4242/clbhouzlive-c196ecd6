import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Calendar, GraduationCap, Building, Award, TrendingUp, Activity } from 'lucide-react';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { StatPill, StatRow } from '../components/StatPill';
import { useTourPlayer, useTourPlayerStatistics, useTourSeason } from '../hooks/useTourHubData';
import { useMemo } from 'react';

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { data: player, isLoading: playerLoading } = useTourPlayer(playerId || '');
  const { data: season } = useTourSeason();
  const { data: allStats } = useTourPlayerStatistics(season?.id);
  
  // Find this player's stats
  const playerStats = useMemo(() => {
    if (!allStats || !playerId) return null;
    return allStats.find(s => s.player_id === playerId) || null;
  }, [allStats, playerId]);
  
  const isLoading = playerLoading;
  
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="pt-6 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-xl" />
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
  
  return (
    <TourHubShell>
      <div className="pt-6 pb-[var(--page-bottom-padding)]">
        {/* Back Link */}
        <Link to="/tourhub?tab=players" className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Players
        </Link>
        
        {/* Hero Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.full_name}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-muted-foreground">{initials}</span>
                )}
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-foreground">{player.full_name}</h1>
                {player.country && (
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {player.country}
                  </p>
                )}
              </div>
            </div>
            
            {/* Right: Quick Stats */}
            <div className="flex items-center gap-3">
              {playerStats ? (
                <>
                  <StatPill label="Events" value={playerStats.events_played} />
                  <StatPill label="Wins" value={playerStats.wins} />
                  <StatPill 
                    label="FedEx Rank" 
                    value={playerStats.fedex_rank ? `#${playerStats.fedex_rank}` : null} 
                  />
                </>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  Stats not yet available
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Body: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Season Performance */}
            {playerStats ? (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Season Performance</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <StatRow label="FedEx Points" value={playerStats.fedex_points} />
                  <StatRow label="FedEx Rank" value={playerStats.fedex_rank} />
                  <StatRow label="Events Played" value={playerStats.events_played} />
                  <StatRow label="Cuts Made" value={playerStats.cuts_made} />
                  <StatRow label="Wins" value={playerStats.wins} />
                  <StatRow label="Top 10s" value={playerStats.top_10s} />
                  <StatRow label="Top 25s" value={playerStats.top_25s} />
                  <StatRow 
                    label="Scoring Average" 
                    value={playerStats.scoring_average} 
                    format={(v) => v.toFixed(2)}
                  />
                  <StatRow 
                    label="Driving Distance" 
                    value={playerStats.driving_distance} 
                    format={(v) => `${v.toFixed(1)} yds`}
                  />
                  <StatRow 
                    label="Driving Accuracy" 
                    value={playerStats.driving_accuracy} 
                    format={(v) => `${v.toFixed(1)}%`}
                  />
                  <StatRow 
                    label="Greens in Regulation" 
                    value={playerStats.greens_in_reg} 
                    format={(v) => `${v.toFixed(1)}%`}
                  />
                  <StatRow 
                    label="Putting Average" 
                    value={playerStats.putting_average} 
                    format={(v) => v.toFixed(3)}
                  />
                  <StatRow 
                    label="Sand Saves" 
                    value={playerStats.sand_saves} 
                    format={(v) => `${v.toFixed(1)}%`}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Season Performance</h2>
                </div>
                
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No season stats for this player yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will populate when the stats feed includes this player.
                  </p>
                </div>
              </div>
            )}
            
            {/* Recent Activity Placeholder */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Recent Activity</h2>
              </div>
              
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Round-by-round results coming soon</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This will populate once live scoring feeds are enabled.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Player Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Player Info</h2>
              
              <div className="space-y-3 text-sm">
                {player.birth_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Birth Date</p>
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
                      <p className="text-muted-foreground">Birth Place</p>
                      <p className="text-foreground">{player.birth_place}</p>
                    </div>
                  </div>
                )}
                
                {player.residence && (
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Residence</p>
                      <p className="text-foreground">{player.residence}</p>
                    </div>
                  </div>
                )}
                
                {player.college && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">College</p>
                      <p className="text-foreground">{player.college}</p>
                    </div>
                  </div>
                )}
                
                {player.turned_pro && (
                  <div className="flex items-start gap-3">
                    <Award className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Turned Pro</p>
                      <p className="text-foreground">{player.turned_pro}</p>
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
            
            {/* Data Source */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 text-center text-xs text-muted-foreground">
              <p>Data powered by Sportradar</p>
              <p className="mt-1">Profile updates as feeds unlock</p>
            </div>
          </div>
        </div>
      </div>
    </TourHubShell>
  );
}
