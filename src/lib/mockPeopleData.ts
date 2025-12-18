/**
 * UI Mock Data for People Tab (Team + Members)
 * For design/layout testing only - frontend-only, no DB risk
 */

// Feature flag - set to false to disable mocks
export const ENABLE_PEOPLE_MOCKS = true;

// Hard-lock mocks to clbhouz test business only
export const MOCK_BUSINESS_ID = '814a8367-d2af-4d38-8096-43f731a1b509';

// Check if we should show mocks for this business
export function isMockBusiness(businessId: string | undefined): boolean {
  return ENABLE_PEOPLE_MOCKS && businessId === MOCK_BUSINESS_ID;
}

// Mock Team data - 10 people with variety
export interface MockTeamMember {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  access: 'Primary manager' | 'Manager' | 'Team';
  is_verified: boolean;
}

export const mockTeam: MockTeamMember[] = [
  {
    id: 'mock-team-1',
    name: 'Alex Morgan',
    username: 'alexmorgan',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    access: 'Primary manager',
    is_verified: true,
  },
  {
    id: 'mock-team-2',
    name: 'Jamie Patel',
    username: 'jamiepatel',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    access: 'Manager',
    is_verified: true,
  },
  {
    id: 'mock-team-3',
    name: 'Chris O\'Neill',
    username: 'chriso',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    access: 'Manager',
    is_verified: false,
  },
  {
    id: 'mock-team-4',
    name: 'Sarah Chen',
    username: 'sarahchen',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    access: 'Team',
    is_verified: true,
  },
  {
    id: 'mock-team-5',
    name: 'Marcus Thompson',
    username: 'marcust',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    access: 'Team',
    is_verified: false,
  },
  {
    id: 'mock-team-6',
    name: 'Elena Rodriguez',
    username: 'elenarodriguez',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    access: 'Team',
    is_verified: false,
  },
  {
    id: 'mock-team-7',
    name: 'David Kim',
    username: 'davidkim',
    avatar_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=face',
    access: 'Team',
    is_verified: true,
  },
  {
    id: 'mock-team-8',
    name: 'Olivia Williams',
    username: 'oliviaw',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    access: 'Team',
    is_verified: false,
  },
  {
    id: 'mock-team-9',
    name: 'James Mitchell-Harbottle',
    username: 'jamesmh',
    avatar_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face',
    access: 'Manager',
    is_verified: true,
  },
  {
    id: 'mock-team-10',
    name: 'Priya Sharma',
    username: 'priyasharma',
    avatar_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=face',
    access: 'Team',
    is_verified: false,
  },
];

// Mock Members data - 25 golfers with handicap variety
export interface MockClubMember {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  handicap: number | null;
  is_verified: boolean;
}

export const mockMembers: MockClubMember[] = [
  // Single-figure handicaps (5)
  { id: 'mock-member-1', name: 'Ben Carter', username: 'bencarter', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face', handicap: 4.2, is_verified: true },
  { id: 'mock-member-2', name: 'Tom Hughes', username: 'tomhughes', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face', handicap: 2.8, is_verified: false },
  { id: 'mock-member-3', name: 'Robert Lee', username: 'robertlee', avatar_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face', handicap: 6.5, is_verified: true },
  { id: 'mock-member-4', name: 'Michael Scott', username: 'michaelscott', avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face', handicap: 8.1, is_verified: false },
  { id: 'mock-member-5', name: 'Daniel Park', username: 'danielpark', avatar_url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&h=200&fit=crop&crop=face', handicap: 5.9, is_verified: true },
  
  // Mid-handicaps (12)
  { id: 'mock-member-6', name: 'Sarah Williams', username: 'sarahw', avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face', handicap: 18.7, is_verified: false },
  { id: 'mock-member-7', name: 'Emma Johnson', username: 'emmaj', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face', handicap: 14.3, is_verified: true },
  { id: 'mock-member-8', name: 'Hannah Brown', username: 'hannahb', avatar_url: 'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?w=200&h=200&fit=crop&crop=face', handicap: 12.0, is_verified: false },
  { id: 'mock-member-9', name: 'Lucas Martinez', username: 'lucasm', avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face', handicap: 15.8, is_verified: false },
  { id: 'mock-member-10', name: 'Sophie Taylor', username: 'sophiet', avatar_url: 'https://images.unsplash.com/photo-1546961342-ea6f6983f9f7?w=200&h=200&fit=crop&crop=face', handicap: 11.2, is_verified: true },
  { id: 'mock-member-11', name: 'Jack Wilson', username: 'jackw', avatar_url: 'https://images.unsplash.com/photo-1499996860823-5f82763f0023?w=200&h=200&fit=crop&crop=face', handicap: 16.4, is_verified: false },
  { id: 'mock-member-12', name: 'Amelia Davis', username: 'ameliad', avatar_url: 'https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=200&h=200&fit=crop&crop=face', handicap: 13.7, is_verified: false },
  { id: 'mock-member-13', name: 'Oliver White', username: 'oliverw', avatar_url: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face', handicap: 10.5, is_verified: true },
  { id: 'mock-member-14', name: 'Charlotte Anderson', username: 'charlottea', avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face', handicap: 17.2, is_verified: false },
  { id: 'mock-member-15', name: 'William Jackson', username: 'williamj', avatar_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face', handicap: 14.9, is_verified: false },
  { id: 'mock-member-16', name: 'Grace Thompson', username: 'gracet', avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop&crop=face', handicap: 12.8, is_verified: true },
  { id: 'mock-member-17', name: 'Henry Moore', username: 'henrym', avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face', handicap: 11.6, is_verified: false },
  
  // Higher handicaps (8)
  { id: 'mock-member-18', name: 'Isabella Clark', username: 'isabellac', avatar_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face', handicap: 24.3, is_verified: false },
  { id: 'mock-member-19', name: 'George Harris', username: 'georgeh', avatar_url: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&h=200&fit=crop&crop=face', handicap: 28.1, is_verified: false },
  { id: 'mock-member-20', name: 'Mia Robinson', username: 'miar', avatar_url: 'https://images.unsplash.com/photo-1508002366005-75a695ee2d17?w=200&h=200&fit=crop&crop=face', handicap: 22.6, is_verified: true },
  { id: 'mock-member-21', name: 'Edward Lewis', username: 'edwardl', avatar_url: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=200&h=200&fit=crop&crop=face', handicap: 19.8, is_verified: false },
  { id: 'mock-member-22', name: 'Ava Walker', username: 'avaw', avatar_url: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=200&h=200&fit=crop&crop=face', handicap: 26.2, is_verified: false },
  { id: 'mock-member-23', name: 'Freddie Hall', username: 'freddieh', avatar_url: 'https://images.unsplash.com/photo-1571512599285-9ac4fdf3dba2?w=200&h=200&fit=crop&crop=face', handicap: 21.4, is_verified: false },
  { id: 'mock-member-24', name: 'Lily Young', username: 'lilyy', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face', handicap: 30.5, is_verified: true },
  { id: 'mock-member-25', name: 'Arthur King', username: 'arthurk', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=face', handicap: 25.7, is_verified: false },
];

// Convert mock team to TeamMember format for compatibility
export function getMockTeamMembers() {
  return mockTeam.map((m) => ({
    id: m.id,
    role: m.access === 'Primary manager' ? 'owner' : m.access === 'Manager' ? 'admin' : 'staff',
    created_at: new Date().toISOString(),
    profile: {
      id: m.id,
      display_name: m.name,
      username: m.username,
      profile_photo_url: m.avatar_url,
      is_verified_golfer: m.is_verified,
    },
  }));
}

// Convert mock members to ClubMember format for compatibility
export function getMockClubMembers() {
  return mockMembers.map((m) => ({
    id: m.id,
    display_name: m.name,
    username: m.username,
    profile_photo_url: m.avatar_url,
    eg_handicap_index: m.handicap,
    is_verified_golfer: m.is_verified,
    show_handicap: true,
  }));
}
