import { NearbyGolfer } from './types';

export function getMockNearby(count = 20): NearbyGolfer[] {
  const base: NearbyGolfer[] = [
    { 
      id: 'm1', 
      display_name: 'Anna "The Eagle" Shaw', 
      home_club: 'Royal Birkdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna', 
      is_online: true, 
      distance_km: 0.4, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm2', 
      display_name: 'Tom "Slice" Miller', 
      home_club: 'Formby Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom', 
      is_online: true, 
      distance_km: 1.2, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm3', 
      display_name: 'Mia Putts', 
      home_club: 'Wallasey Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mia', 
      is_online: true, 
      distance_km: 2.1, 
      same_club: true,
      isOpenToPlay: false
    },
    { 
      id: 'm4', 
      display_name: 'Ben Holmes', 
      home_club: 'Hillside Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ben', 
      is_online: true, 
      distance_km: 0.7, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm5', 
      display_name: 'Sarah "Birdie" Chen', 
      home_club: 'Royal Liverpool (Hoylake)', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 
      is_online: true, 
      distance_km: 3.8, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm6', 
      display_name: 'James "Lefty" Wilson', 
      home_club: 'Royal Birkdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', 
      is_online: true, 
      distance_km: 0.9, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm7', 
      display_name: 'Emily "Par" Davidson', 
      home_club: 'Southport & Ainsdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', 
      is_online: true, 
      distance_km: 1.5, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm8', 
      display_name: 'Marcus "Driver" Johnson', 
      home_club: 'Formby Hall', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus', 
      is_online: true, 
      distance_km: 2.3, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm9', 
      display_name: 'Sophie "Ace" Martinez', 
      home_club: 'Royal Birkdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie', 
      is_online: true, 
      distance_km: 0.6, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm10', 
      display_name: 'Oliver "Chip" Thompson', 
      home_club: 'Hillside Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oliver', 
      is_online: true, 
      distance_km: 1.8, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm11', 
      display_name: 'Rachel "Hook" Anderson', 
      home_club: 'Wallasey Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel', 
      is_online: true, 
      distance_km: 2.7, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm12', 
      display_name: 'Daniel "Fade" Roberts', 
      home_club: 'Royal Liverpool (Hoylake)', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=daniel', 
      is_online: true, 
      distance_km: 4.1, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm13', 
      display_name: 'Grace "Putter" Lee', 
      home_club: 'Royal Birkdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace', 
      is_online: true, 
      distance_km: 0.3, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm14', 
      display_name: 'Lucas "Draw" Cooper', 
      home_club: 'Formby Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas', 
      is_online: true, 
      distance_km: 1.4, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm15', 
      display_name: 'Isabella "Long" Garcia', 
      home_club: 'Southport & Ainsdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabella', 
      is_online: true, 
      distance_km: 2.0, 
      same_club: false,
      isOpenToPlay: false
    },
    { 
      id: 'm16', 
      display_name: 'Noah "Bogey" Taylor', 
      home_club: 'Hillside Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah', 
      is_online: true, 
      distance_km: 3.2, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm17', 
      display_name: 'Ava "Short Game" White', 
      home_club: 'Royal Birkdale', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ava', 
      is_online: true, 
      distance_km: 0.5, 
      same_club: true,
      isOpenToPlay: false
    },
    { 
      id: 'm18', 
      display_name: 'Ethan "Bunker" Harris', 
      home_club: 'Wallasey Golf Club', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ethan', 
      is_online: true, 
      distance_km: 2.5, 
      same_club: true,
      isOpenToPlay: true
    },
    { 
      id: 'm19', 
      display_name: 'Charlotte "Scramble" King', 
      home_club: 'Formby Hall', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlotte', 
      is_online: true, 
      distance_km: 3.6, 
      same_club: false,
      isOpenToPlay: true
    },
    { 
      id: 'm20', 
      display_name: 'William "Wedge" Scott', 
      home_club: 'Royal Liverpool (Hoylake)', 
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=william', 
      is_online: true, 
      distance_km: 4.5, 
      same_club: false,
      isOpenToPlay: false
    },
  ];
  return base.slice(0, count);
}
