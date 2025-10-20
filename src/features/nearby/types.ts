export type NearbyGolfer = {
  id: string;
  display_name: string;
  home_club?: string;
  avatar_url?: string;
  is_online: boolean;
  distance_km?: number;
  same_club?: boolean;
};
