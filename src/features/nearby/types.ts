export type NearbyGolfer = {
  id: string;
  display_name: string;
  home_club?: string;
  avatar_url?: string;
  is_online: boolean;
  distance_km?: number;
  same_club?: boolean;
};

export type BeaconAudience = 'followers' | 'friends' | 'nearby' | 'custom';
export type BeaconFormat = '9' | '18' | 'range' | 'casual' | 'stroke' | 'scramble';

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

export type GameBeacon = GameBeaconDraft & {
  id: string;
  creatorUserId: string;
  createdAtISO: string;
  expiresAtISO: string;
  status: 'active' | 'cancelled' | 'expired';
};
