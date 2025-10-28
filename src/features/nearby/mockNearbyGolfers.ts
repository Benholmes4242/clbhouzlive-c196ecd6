import { NearbyGolfer } from './types';

export function getMockNearby(count = 5): NearbyGolfer[] {
  const base: NearbyGolfer[] = [
    { 
      id: 'm1', 
      display_name: 'Anna Shaw', 
      home_club: 'Royal Birkdale', 
      avatar_url: '/images/mocks/avatars/anna_shaw.jpg', 
      is_online: true, 
      distance_km: 0.4, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm2', 
      display_name: 'Tom "Slice" Miller', 
      home_club: 'Formby Golf Club', 
      avatar_url: '/images/mocks/avatars/tom_slice.jpg', 
      is_online: true, 
      distance_km: 1.2, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm3', 
      display_name: 'Mia Putts', 
      home_club: 'Wallasey Golf Club', 
      avatar_url: '/images/mocks/avatars/mia_putts.jpg', 
      is_online: false, 
      distance_km: 2.1, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm4', 
      display_name: 'Ben Holmes', 
      home_club: 'Hillside Golf Club', 
      avatar_url: '/images/mocks/avatars/ben_holmes.jpg', 
      is_online: true, 
      distance_km: 0.7, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm5', 
      display_name: 'Classic Golf Pro', 
      home_club: 'Royal Liverpool (Hoylake)', 
      avatar_url: '/images/mocks/avatars/classic_golf_pro.jpg', 
      is_online: false, 
      distance_km: 3.8, 
      same_club: false,
      isOpenToPlay: false
    },
  ];
  return base.slice(0, count);
}
