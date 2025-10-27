import React, { useEffect, useState } from 'react';
import { MapPin, Users } from 'lucide-react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { supabase } from '@/integrations/supabase/client';

interface GamesNearbyListProps {
  beacons: GameBeacon[];
  isLoading: boolean;
  onJoinBeacon: (beaconId: string) => void;
  onCancelBeacon: (beaconId: string) => void;
  onCreateGame: () => void;
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

  // Fetch host profiles
  useEffect(() => {
    const fetchHostProfiles = async () => {
      const hostIds = [...new Set(beacons.map(b => b.host_user_id))];
      if (hostIds.length === 0) return;

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
  }, [beacons]);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-neutral-800/30 rounded-xl p-4 h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (beacons.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <MapPin className="w-12 h-12 mx-auto text-neutral-600" />
        <div>
          <p className="font-medium text-neutral-300 mb-1">No games nearby</p>
          <p className="text-sm text-neutral-500">Start one and see who joins</p>
        </div>
        <button
          onClick={onCreateGame}
          className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-xl font-medium backdrop-blur border border-white/28 shadow-[0_20px_48px_rgba(0,0,0,0.9),_0_0_30px_rgba(255,255,255,0.18)_inset] active:shadow-[0_24px_54px_rgba(0,0,0,0.9),_0_0_40px_rgba(255,255,255,0.28)] transition-all"
        >
          Create a Game
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {beacons.map(beacon => {
        const host = hostProfiles[beacon.host_user_id];
        const hostName = host?.display_name || host?.username || 'Golfer';
        const hostAvatar = host?.profile_photo_url;

        return (
          <div
            key={beacon.id}
            className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/50 hover:border-neutral-600/50 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Host Avatar */}
              <div className="flex-shrink-0">
                {hostAvatar ? (
                  <img
                    src={hostAvatar}
                    alt={hostName}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center">
                    <Users className="w-6 h-6 text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-100 truncate">{hostName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/15 text-white text-xs font-medium backdrop-blur border border-white/22">
                        {beacon.game_type}
                      </span>
                      {beacon.distanceText && (
                        <span className="text-xs text-neutral-400">
                          {beacon.distanceText} away
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {beacon.course_name && (
                  <p className="text-sm text-neutral-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    {beacon.course_name}
                  </p>
                )}

                {beacon.note && (
                  <p className="text-sm text-neutral-400 mb-3 line-clamp-1">
                    {beacon.note}
                  </p>
                )}

                {/* CTA Button */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    {beacon.participants.length > 0 && (
                      <span>{beacon.participants.length} joined</span>
                    )}
                  </div>
                  {beacon.isHost ? (
                    <button
                      onClick={() => onCancelBeacon(beacon.id)}
                      className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel Game
                    </button>
                  ) : (
                    <button
                      onClick={() => onJoinBeacon(beacon.id)}
                      className="px-4 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/30 text-white rounded-lg text-sm font-medium backdrop-blur border border-white/28 shadow-[0_16px_32px_rgba(0,0,0,0.9),_0_0_24px_rgba(255,255,255,0.2)] active:shadow-[0_20px_40px_rgba(0,0,0,0.9),_0_0_32px_rgba(255,255,255,0.3)] transition-all"
                    >
                      I'm in
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
