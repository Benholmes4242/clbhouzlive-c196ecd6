/**
 * Mock golfer data for front-end visual testing
 * To enable: set VITE_USE_MOCK_GOLFERS=true in your environment
 * To remove: delete this file and remove the mock logic from useActiveGolfers.ts
 */

const mockNames = [
  'James Thompson',
  'Sarah Mitchell',
  'Michael Chen',
  'Emma Wilson',
  'David Roberts',
  'Olivia Garcia',
  'Thomas Anderson',
  'Sophia Martinez',
  'William Taylor',
  'Isabella Brown',
  'Alexander Lee',
  'Charlotte Davis',
  'Benjamin White',
  'Amelia Johnson',
  'Daniel Moore',
];

const mockClubs = [
  'Sunningdale',
  'Wentworth',
  'The Wisley',
  'St Andrews',
  'Royal Birkdale',
  'Muirfield',
  'Turnberry',
];

export const mockGolfers = Array.from({ length: 15 }, (_, i) => ({
  id: `mock-${i + 1}`,
  user_id: `mock-${i + 1}`,
  display_name: mockNames[i],
  username: mockNames[i].toLowerCase().replace(' ', '_'),
  profile_photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockNames[i]}`,
  eg_handicap_index: Number((Math.random() * 20 + 1).toFixed(1)),
  home_club: mockClubs[i % mockClubs.length],
  distance_m: 200 + i * 150 + Math.floor(Math.random() * 100),
  open_to_play: i % 2 === 0, // More golfers open to play (every other one)
  same_club: i % 4 === 0, // Some golfers from same club
  latitude: 51.4 + Math.random() * 0.02,
  longitude: -0.6 + Math.random() * 0.02,
  updated_at: new Date().toISOString(),
}));
