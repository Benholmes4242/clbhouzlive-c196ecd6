import { Ping, PingCard, PingResponseMini } from '../types';
import { nanoid } from 'nanoid';

// Mock data store
export const mockStore = {
  pings: [] as Ping[],
  responses: [] as any[],
  matches: [] as any[],
};

// Sample mock users
const mockUsers = [
  {
    id: 'mock-user-1',
    display_name: 'Tom "Slice" Anderson',
    username: 'tomslice',
    profile_photo_url: '/placeholder.svg',
    home_club: 'Royal Birkdale',
    handicap: 3,
  },
  {
    id: 'mock-user-2',
    display_name: 'Sarah Chen',
    username: 'sarahc',
    profile_photo_url: '/placeholder.svg',
    home_club: 'St Andrews Links',
    handicap: 8,
  },
  {
    id: 'mock-user-3',
    display_name: 'Mike Johnson',
    username: 'mikej',
    profile_photo_url: '/placeholder.svg',
    home_club: 'Pebble Beach',
    handicap: 12,
  },
  {
    id: 'mock-user-4',
    display_name: 'Emma Williams',
    username: 'emmaw',
    profile_photo_url: '/placeholder.svg',
    home_club: 'Augusta National',
    handicap: 5,
  },
  {
    id: 'mock-user-5',
    display_name: 'David Lee',
    username: 'davidl',
    profile_photo_url: '/placeholder.svg',
    home_club: 'Turnberry',
    handicap: 15,
  },
];

// Initialize mock pings
export function initializeMockData() {
  if (mockStore.pings.length > 0) return; // Already initialized

  const now = Date.now();
  const formats: ('NINE' | 'EIGHTEEN' | 'RANGE' | 'CASUAL')[] = ['NINE', 'EIGHTEEN', 'RANGE', 'CASUAL'];
  const visibilities: ('FRIENDS' | 'NEARBY' | 'ALL')[] = ['FRIENDS', 'NEARBY', 'ALL'];

  // Create 8 mock pings with varying properties
  for (let i = 0; i < 8; i++) {
    const user = mockUsers[i % mockUsers.length];
    const isAnonymous = i % 3 === 0; // Every 3rd ping is anonymous
    const format = formats[i % formats.length];
    const visibility = visibilities[i % visibilities.length];
    
    // Random location within 5km
    const baseLat = 53.5; // Approximate UK center
    const baseLng = -2.5;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.09; // ~5km variation
    const randomLng = baseLng + (Math.random() - 0.5) * 0.09;

    const expiresAt = new Date(now + (15 + Math.random() * 10) * 60 * 1000).toISOString();

    const ping: Ping = {
      id: `mock-ping-${nanoid()}`,
      creator_id: user.id,
      club_id: undefined,
      lat: randomLat,
      lng: randomLng,
      players_needed: (i % 3) + 1 as 1 | 2 | 3,
      format,
      visibility,
      is_anonymous: isAnonymous,
      note: i % 2 === 0 ? `Looking for quick ${format.toLowerCase()}` : undefined,
      expires_at: expiresAt,
      status: 'ACTIVE',
      created_at: new Date(now - Math.random() * 300000).toISOString(),
      club: {
        id: 'mock-club-1',
        name: user.home_club,
      },
    };

    mockStore.pings.push(ping);
  }

  console.log('[Mock] Initialized', mockStore.pings.length, 'pings');
  
  // Auto-expire pings after their expiration time
  setInterval(() => {
    const now = new Date();
    mockStore.pings = mockStore.pings.filter(ping => {
      if (ping.status === 'ACTIVE' && new Date(ping.expires_at) < now) {
        ping.status = 'CLOSED';
        console.log('[Mock] Expired ping:', ping.id);
        return false;
      }
      return true;
    });
  }, 60000); // Check every minute
}

export function getMockUserProfile(userId: string) {
  return mockUsers.find(u => u.id === userId) || mockUsers[0];
}

// Distance calculation helper
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
