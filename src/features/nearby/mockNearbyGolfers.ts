import { NearbyGolfer } from './types';

export function getMockNearby(count = 5): NearbyGolfer[] {
  const base: NearbyGolfer[] = [
    { 
      id: 'm1', 
      display_name: 'Anna Shaw', 
      home_club: 'Royal Birkdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', 
      is_online: true, 
      distance_km: 0.4, 
      same_club: false 
    },
    { 
      id: 'm2', 
      display_name: 'Tom "Slice" Miller', 
      home_club: 'Formby Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', 
      is_online: true, 
      distance_km: 1.2, 
      same_club: false 
    },
    { 
      id: 'm3', 
      display_name: 'Mia Putts', 
      home_club: 'Wallasey Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', 
      is_online: false, 
      distance_km: 2.1, 
      same_club: false 
    },
    { 
      id: 'm4', 
      display_name: 'Ben Holmes', 
      home_club: 'Hillside Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben', 
      is_online: true, 
      distance_km: 0.7, 
      same_club: true 
    },
    { 
      id: 'm5', 
      display_name: 'Classic Golf Pro', 
      home_club: 'Royal Liverpool (Hoylake)', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Classic', 
      is_online: false, 
      distance_km: 3.8, 
      same_club: false 
    },
  ];
  return base.slice(0, count);
}
