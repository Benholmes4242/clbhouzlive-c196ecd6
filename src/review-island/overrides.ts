// No imports from your app!

export type FlowKey = 'nearby' | 'createGame';
export interface FlowState { id: string; flow: FlowKey; name: string; description?: string; }
export interface ReviewDataOverrides {
  nearbyGolfers?: any[];
  gameBeacons?: any[];
  myBeacon?: any | null;
}

// Inline fixtures (isolated from main app)
const FIXED_NEARBY_GOLFERS = [
  { 
    id: 'g1', 
    display_name: 'Sarah Mitchell',
    home_club: 'Royal Birkdale',
    avatar_url: '/images/mocks/avatars/anna_shaw.jpg',
    is_online: true,
    distance_km: 0.5,
    same_club: true,
    isOpenToPlay: true,
    handicap: 8.4 
  },
  { 
    id: 'g2', 
    display_name: 'James Cooper',
    home_club: 'Formby Golf Club',
    avatar_url: '/images/mocks/avatars/tom_slice.jpg',
    is_online: true,
    distance_km: 1.2,
    same_club: false,
    isOpenToPlay: true,
    handicap: 15.2 
  },
  { 
    id: 'g3', 
    display_name: 'Emma Watson',
    home_club: 'Wallasey Golf Club',
    avatar_url: '/images/mocks/avatars/mia_putts.jpg',
    is_online: true,
    distance_km: 2.0,
    same_club: true,
    isOpenToPlay: false,
    handicap: 12.8
  },
];

const FIXED_GAME_BEACONS = [
  { 
    id: 'b1', 
    course_name: 'Royal Birkdale',
    game_type: '18_holes',
    start_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    note: '2 spots open, casual round',
    slots_total: 4,
    slots_open: 2,
    host_profile: {
      display_name: 'Alex Thompson',
      avatar_url: '/images/mocks/avatars/anna_shaw.jpg',
      home_club: 'Royal Birkdale',
      eg_handicap_index: 12.5
    }
  },
  { 
    id: 'b2', 
    course_name: 'Formby Golf Club',
    game_type: '9_holes',
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    note: 'Quick 9 before sunset',
    slots_total: 2,
    slots_open: 1,
    host_profile: {
      display_name: 'Sophie Martinez',
      avatar_url: '/images/mocks/avatars/mia_putts.jpg',
      home_club: 'Formby Golf Club',
      eg_handicap_index: 8.2
    }
  },
];

export function getOverrides(state?: FlowState | null): ReviewDataOverrides {
  const id = state?.id ?? '';
  if (id === 'nearby-07-golfers-list') return { nearbyGolfers: FIXED_NEARBY_GOLFERS };
  if (id === 'nearby-08-games-list')   return { gameBeacons: FIXED_GAME_BEACONS };
  if (id.startsWith('creategame-'))    return { myBeacon: null };
  return { nearbyGolfers: FIXED_NEARBY_GOLFERS, gameBeacons: FIXED_GAME_BEACONS, myBeacon: null };
}
