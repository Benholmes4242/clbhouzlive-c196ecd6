import { FLAGS } from '@/config/flags';

const firstNames = [
  'James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Benjamin', 'Isabella',
  'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Sebastian', 'Harper',
  'Jack', 'Evelyn', 'Aiden', 'Abigail', 'Owen', 'Emily', 'Samuel', 'Elizabeth',
  'Ryan', 'Sofia', 'Nathan', 'Avery', 'Leo', 'Ella', 'Ian', 'Scarlett',
  'Andrew', 'Grace', 'Joshua', 'Chloe', 'Christopher', 'Victoria', 'Theodore', 'Riley',
  'Caleb', 'Aria', 'Dylan', 'Lily', 'Levi', 'Aurora', 'Christian', 'Zoey',
  'Hunter', 'Penelope', 'Jordan', 'Layla', 'Connor', 'Nora', 'Eli', 'Camila',
  'Ezra', 'Hannah', 'Aaron', 'Addison'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Turner', 'Phillips', 'Evans', 'Parker', 'Edwards', 'Collins',
  'Stewart', 'Morris', 'Murphy', 'Cook'
];

const clubs = [
  'Pebble Beach Golf Links', 'Augusta National', 'St Andrews Links', 'Pinehurst Resort',
  'TPC Sawgrass', 'Torrey Pines', 'Bethpage Black', 'Whistling Straits',
  'Bandon Dunes', 'Kiawah Island', 'Spyglass Hill', 'Shadow Creek',
  'Merion Golf Club', 'Oakmont Country Club', 'Shinnecock Hills', 'Winged Foot',
  'The Country Club', 'Olympic Club', 'Riviera Country Club', 'Muirfield Village',
  null, null, null, null // Some users without clubs
];

export interface MockSocialUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  home_club: string | null;
  follower_count: number;
  following_count: number;
  friend_count: number;
  is_following?: boolean;
  is_friend?: boolean;
  online_status?: string;
}

function generateMockUsers(count: number): MockSocialUser[] {
  const users: MockSocialUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const displayName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
    
    users.push({
      id: `mock-user-${i}`,
      display_name: displayName,
      username,
      avatar_url: `https://i.pravatar.cc/150?u=${username}`,
      home_club: clubs[i % clubs.length],
      follower_count: Math.floor(Math.random() * 500),
      following_count: Math.floor(Math.random() * 300),
      friend_count: Math.floor(Math.random() * 100),
      is_following: Math.random() > 0.5,
      is_friend: Math.random() > 0.7,
      online_status: Math.random() > 0.8 ? 'online' : 'offline',
    });
  }
  
  return users;
}

const MOCK_USERS = generateMockUsers(60);

export function getMockSocialUsers(): MockSocialUser[] {
  if (!FLAGS.MOCK_SOCIAL_USERS_ENABLED) return [];
  return MOCK_USERS;
}
