import React, { useEffect, useState } from 'react';
import { MapPin, Users, Clock } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';
import { useActiveGolfers } from '@/hooks/useActiveGolfers';
import { Badge } from '@/components/ui/badge';
import { ClubSearchInput } from './ClubSearchInput';

// Format game type for display
function formatGameType(gameType: string): string {
  const typeMap: Record<string, string> = {
    '9_holes': '9 holes',
    '18_holes': '18 holes',
    'casual_golf': 'Casual golf',
    'practice': 'Practice',
  };
  return typeMap[gameType] || gameType;
}

// Format when/time for display
function formatWhen(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diffMinutes = Math.floor((start.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes <= 5) return 'Now';
  if (diffMinutes <= 30) return 'In 30 mins';
  if (diffMinutes <= 60) return 'In 1 hour';
  
  // Check if today
  const isToday = start.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === start.toDateString();
  
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  
  if (isToday) return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;
  
  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface GamesNearbyListProps {
  beacons: GameBeacon[];
  isLoading: boolean;
  onJoinBeacon: (beaconId: string) => void;
  onCancelBeacon: (beaconId: string) => void;
  onCreateGame: (clubData?: { id: string; name: string }) => void;
}

interface HostProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}

export function GamesNearbyList({
  beacons,
  isLoading,
  onJoinBeacon,
  onCancelBeacon,
  onCreateGame,
}: GamesNearbyListProps) {
  const [hostProfiles, setHostProfiles] = useState<Record<string, HostProfile>>({});
  const [selectedClub, setSelectedClub] = useState<{ id: string; name: string } | null>(null);
  const [clubGames, setClubGames] = useState<GameBeacon[]>([]);
  const [isLoadingClubGames, setIsLoadingClubGames] = useState(false);
  const { golfers } = useActiveGolfers({ limit: 20, mockCount: 0 });
  
  // Filter for golfers who are OpenToPlay
  const openToPlayGolfers = golfers.filter(g => !g.isMock && g.isOpenToPlay);

  // Fetch games at selected club
  useEffect(() => {
    if (!selectedClub) {
      setClubGames([]);
      return;
    }

    const fetchClubGames = async () => {
      setIsLoadingClubGames(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        const { data, error } = await supabase
          .from('game_beacons')
          .select('*')
          .eq('course_name', selectedClub.name)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString());

        if (error) throw error;

        const gamesWithHostFlag = (data || []).map(beacon => ({
          ...beacon,
          isHost: beacon.host_user_id === currentUserId,
        }));

        setClubGames(gamesWithHostFlag);
      } catch (error) {
        console.error('Error fetching club games:', error);
        setClubGames([]);
      } finally {
        setIsLoadingClubGames(false);
      }
    };

    fetchClubGames();
  }, [selectedClub]);

  // Fetch host profiles for game beacons
  useEffect(() => {
    const allGames = selectedClub ? clubGames : beacons;
    const hostIds = [...new Set(allGames.map(b => b.host_user_id))];
    if (hostIds.length === 0) return;

    const fetchHostProfiles = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', hostIds);

      if (error) {
        console.error('Error fetching host profiles:', error);
        return;
      }

      const profilesMap: Record<string, HostProfile> = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });
      setHostProfiles(profilesMap);
    };

    fetchHostProfiles();
  }, [beacons, clubGames, selectedClub]);

  const handleClubSelect = (club: { id: string; name: string; country: string; region?: string }) => {
    setSelectedClub({ id: club.id, name: club.name });
  };

  const handleClearSearch = () => {
    setSelectedClub(null);
    setClubGames([]);
  };

  if (isLoading) {
    return (
      <>
        <ClubSearchInput
          onClubSelect={handleClubSelect}
          onClear={handleClearSearch}
          selectedClub={selectedClub}
        />
        <div className="py-12 text-center">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-neutral-800/30 rounded-xl p-4 h-24" />
            ))}
          </div>
        </div>
      </>
    );
  }

  const displayGames = selectedClub ? clubGames : beacons;
  const hasGames = displayGames.length > 0 || (!selectedClub && openToPlayGolfers.length > 0);

  if (!hasGames && !selectedClub) {
    return (
      <div className="space-y-4">
        <div className="py-12 text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-neutral-600" />
          <div>
            <p className="font-medium text-neutral-300 mb-1">No games nearby</p>
            <p className="text-sm text-neutral-500">Start one and see who joins</p>
          </div>
          <button
            onClick={() => onCreateGame()}
            className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all"
          >
            Create a Game
          </button>
        </div>
        <ClubSearchInput
          onClubSelect={handleClubSelect}
          onClear={handleClearSearch}
          selectedClub={selectedClub}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Club Search */}
      <ClubSearchInput
        onClubSelect={handleClubSelect}
        onClear={handleClearSearch}
        selectedClub={selectedClub}
      />

      {/* Show loading state for club games */}
      {isLoadingClubGames ? (
        <div className="py-8 text-center">
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-neutral-800/30 rounded-xl p-4 h-24" />
            ))}
          </div>
        </div>
      ) : selectedClub && clubGames.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-sm text-neutral-300">No active games at {selectedClub.name}</p>
          <p className="text-xs text-neutral-500">Be the first to start one!</p>
          <button
            onClick={() => onCreateGame(selectedClub)}
            className="mt-2 px-6 py-2 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl text-sm font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] transition-all"
          >
            Create a Game
          </button>
        </div>
      ) : null}

      {/* OpenToPlay golfers section - only show when not searching */}
      {!selectedClub && openToPlayGolfers.length > 0 && (
        <>
          <div className="text-xs font-medium text-white/50 px-2 pt-2">
            Open to Play Now
          </div>
          {openToPlayGolfers.map((golfer) => (
            <div
              key={`open-${golfer.id}`}
              className="rounded-2xl px-4 py-3 bg-neutral-800/40 border border-neutral-700/50"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div 
                  className="relative shrink-0 w-12 h-12 rounded-[14px] overflow-hidden border border-white/30 bg-black/40"
                  style={{ boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)' }}
                >
                  <img
                    src={golfer.avatar_url || '/placeholder.svg'}
                    alt={golfer.display_name}
                    className="w-full h-full object-cover"
                  />
                  {golfer.is_online && (
                    <div 
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full"
                      aria-label="Online"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div>
                    <h3 className="font-semibold text-[15px] text-white truncate">
                      {golfer.display_name}
                    </h3>
                    {golfer.home_club && (
                      <p className="text-xs text-white/60 truncate">
                        {golfer.home_club}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="inline-flex items-center gap-1">
                      🟢 Open to play now
                    </span>
                    {golfer.distanceText && (
                      <span>• {golfer.distanceText}</span>
                    )}
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => {
                      // TODO: Open message composer or invite flow
                      console.log('Request to join:', golfer.id);
                    }}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Request to Join
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Unified games list */}
      {displayGames.length > 0 && (
        <>
          {!selectedClub && openToPlayGolfers.length > 0 && (
            <div className="text-xs font-medium text-white/50 px-2 pt-4">
              Games
            </div>
          )}
          {selectedClub && (
            <div className="text-xs font-medium text-white/50 px-2 pt-2">
              Games at {selectedClub.name}
            </div>
          )}
          {displayGames.map(beacon => {
            const host = hostProfiles[beacon.host_user_id];
            const hostName = host?.display_name || host?.username || 'Golfer';

            return (
              <div
                key={beacon.id}
                className="rounded-xl px-3 py-3 bg-neutral-800/60 border border-neutral-700/60 hover:border-neutral-600/60 transition-all"
              >
                {/* Row 1: Location + Me pill */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-medium text-[15px] text-white/95 truncate flex-1">
                    {beacon.course_name || 'Golf Course'}
                  </h3>
                  {beacon.isHost && (
                    <Badge 
                      variant="outline" 
                      className="bg-white/20 text-neutral-900 border-white/30 backdrop-blur-md hover:bg-white/30 font-semibold px-2 py-0.5 text-xs rounded-full"
                    >
                      Me
                    </Badge>
                  )}
                </div>

                {/* Row 2: Meta info (time + players) */}
                <div className="flex items-center gap-3 text-xs text-white/60 mb-2">
                  <span className="inline-flex items-center gap-1">
                    🕒 {formatWhen(beacon.start_time)}
                  </span>
                  {beacon.players_needed && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        👤 {beacon.players_needed === 1 
                          ? 'Need 1 more'
                          : `${beacon.players_needed} spots free`}
                      </span>
                    </>
                  )}
                </div>

                {/* Row 3: Note/description */}
                {beacon.note && (
                  <p className="text-sm text-white/80 mb-3 line-clamp-2">
                    {beacon.note}
                  </p>
                )}

                {/* Action button */}
                {!beacon.isHost && (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => onJoinBeacon(beacon.id)}
                      className="px-4 py-1.5 rounded-lg bg-neutral-800/60 border border-white/20 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                      Request to Join
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
