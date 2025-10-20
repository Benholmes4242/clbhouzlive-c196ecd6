export type PingFormat = 'NINE' | 'EIGHTEEN' | 'RANGE' | 'CASUAL';
export type PingVisibility = 'FRIENDS' | 'NEARBY' | 'ALL';
export type PingStatus = 'ACTIVE' | 'MATCHING' | 'CLOSED';
export type PingResponseState = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface CreatePingInput {
  clubId?: string;
  lat?: number;
  lng?: number;
  playersNeeded: 1 | 2 | 3;
  format: PingFormat;
  visibility: PingVisibility;
  isAnonymous: boolean;
  note?: string;
  durationMins?: number;
}

export interface UserMini {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  handicap: number | null;
}

export interface PingCard {
  id: string;
  creator?: UserMini;
  clubId?: string;
  clubName?: string;
  format: PingFormat;
  playersNeeded: number;
  visibility: PingVisibility;
  note?: string;
  expiresAt: string;
  isAnonymous: boolean;
  homeClub?: string;
  handicap?: number | null;
  distance?: number;
}

export interface PingResponseMini {
  id: string;
  message?: string;
  state: PingResponseState;
  created_at: string;
  responder: UserMini;
}

export interface Ping {
  id: string;
  creator_id: string;
  club_id?: string;
  lat?: number;
  lng?: number;
  players_needed: number;
  format: PingFormat;
  visibility: PingVisibility;
  is_anonymous: boolean;
  note?: string;
  expires_at: string;
  status: PingStatus;
  created_at: string;
  updated_at?: string;
  club?: {
    id: string;
    name: string;
  };
  responses?: PingResponseMini[];
}

export interface PingResponse {
  id: string;
  ping_id: string;
  responder_id: string;
  message?: string;
  state: PingResponseState;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponse {
  result: 'ACCEPTED' | 'DECLINED';
  revealedProfile?: UserMini;
  responder?: UserMini;
  dmThreadId?: string;
}
