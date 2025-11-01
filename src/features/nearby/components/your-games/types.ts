export type Role = 'host' | 'player';

export interface Participant {
  user_id: string | null;
  username?: string | null;
  display_name?: string | null;
  profile_photo_url?: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  role: Role;
}

export interface Game {
  id: string;
  course_name: string;
  course_id?: string | null;
  start_time: string;      // ISO
  expires_at: string;      // ISO
  status: 'active' | 'cancelled' | 'draft' | string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
  visibility?: 'public' | 'friends' | 'club' | string;
  note?: string | null;
  participants?: Participant[]; // optional — card won't assume
}

export type CardVariant = 'hosting' | 'joined';
