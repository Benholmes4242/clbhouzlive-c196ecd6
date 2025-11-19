export type NearbyGolfer = {
  id: string;
  display_name: string;
  home_club?: string;
  avatar_url?: string;
  is_online: boolean;
  distance_km?: number;
  same_club?: boolean;
  sameHomeClub?: boolean;
  isOpenToPlay?: boolean;
  handicap?: number;
};

export type BeaconAudience = 'followers' | 'friends' | 'nearby' | 'custom';
export type BeaconFormat = '9' | '18' | 'range' | 'casual' | 'stroke' | 'scramble';
export type GameVisibility = 'public' | 'friends' | 'club';

export type GameBeaconDraft = {
  when: 'now' | '30m' | '1h' | { atISO: string; durationMin?: number };
  whereClubId: string;
  playersNeeded: 1 | 2 | 3;
  formats: BeaconFormat[];
  notes?: string;
  audience: BeaconAudience;
  customAudienceIds?: string[];
  visibilityWindowMin: 60 | 120 | 480; // 1h, 2h, Today
  sendPush: boolean;
};

// New game types matching database schema
export type GameParticipant = {
  id: string;
  game_id: string;
  user_id: string;
  role: 'host' | 'player';
  state: 'invited' | 'accepted' | 'declined' | 'removed';
  reserves_slot: boolean;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    id: string;
    display_name: string;
    username?: string;
    profile_photo_url?: string;
    handicap?: number;
    show_handicap?: boolean;
  };
};

export type Game = {
  id: string;
  host_user_id: string;
  course_id?: string;
  course_name?: string;
  start_time: string;
  expires_at: string;
  status: 'active' | 'canceled' | 'completed' | 'expired' | 'at_capacity';
  visibility: 'public' | 'friends' | 'club';
  slots_total: number;
  slots_open: number;
  note?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  isHost?: boolean;
  distance_meters?: number;
  distanceText?: string;
  participants?: GameParticipant[];
  players_needed?: number; // For backwards compat, derives from slots_open
};

// Legacy type for backwards compat - maps to new Game type
export type GameBeacon = Game & {
  creatorUserId: string; // maps to host_user_id
  createdAtISO: string; // maps to created_at
  expiresAtISO: string; // maps to expires_at
};