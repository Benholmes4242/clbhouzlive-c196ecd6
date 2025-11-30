import type { Top100ProgressResponse } from '@/hooks/useTop100ProgressForUser';
import type { Top100FriendsSnapshotResponse, Top100FriendSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { getTop100Club } from './top100Club';

type MyJourneyPreset = 'real' | 'none' | '5' | '20' | '50' | '100' | '200';
type FriendsPreset = 'real' | 'none' | 'low' | 'mid' | 'high';

export function applyMyJourneyDebug(
  realData: Top100ProgressResponse | null | undefined,
  preset: MyJourneyPreset
): Top100ProgressResponse | null | undefined {
  if (preset === 'real' || !realData) return realData;

  const target = presetToNumber(preset);
  
  // Determine club based on target
  const club = getTop100Club(target);
  
  // Create a simplified override
  const override: Top100ProgressResponse = {
    ...realData,
    total_played_top100: target,
    total_top100_rated: target,
    regions_count: target > 0 ? Math.min(target, 4) : 0,
    lists: realData.lists.map((list, idx) => {
      // Distribute courses roughly across lists
      const share = Math.floor(target / realData.lists.length);
      const extra = idx === 0 ? target % realData.lists.length : 0;
      return {
        ...list,
        played: share + extra,
      };
    }),
    club_ring: club?.ring ?? 'none',
    club_label: club?.label ?? null,
    next_milestone: realData.next_milestone,
    recent_rounds: realData.recent_rounds,
  };
  
  return override;
}

export function applyFriendsDebug(
  realData: Top100FriendsSnapshotResponse | null | undefined,
  preset: FriendsPreset
): Top100FriendsSnapshotResponse | null | undefined {
  if (preset === 'real' || !realData) return realData;
  
  if (preset === 'none') {
    return {
      me: realData?.me ?? null,
      friends: [],
    };
  }
  
  // Simulate friends
  const mockFriends: Top100FriendSnapshot[] = [
    { 
      friend_id: 'mock-1', 
      display_name: 'Alex Chen',
      profile_photo_url: null,
      home_club: null,
      total_top100_played: 0 
    },
    { 
      friend_id: 'mock-2', 
      display_name: 'Jamie Parker',
      profile_photo_url: null,
      home_club: null,
      total_top100_played: 0 
    },
    { 
      friend_id: 'mock-3', 
      display_name: 'Sam Rivera',
      profile_photo_url: null,
      home_club: null,
      total_top100_played: 0 
    },
  ];
  
  const baseValue = realData?.me?.total_top100_played ?? 20;
  
  if (preset === 'low') {
    mockFriends[0].total_top100_played = Math.max(0, baseValue - 1);
    mockFriends[1].total_top100_played = Math.max(0, baseValue - 3);
    mockFriends[2].total_top100_played = Math.max(0, baseValue - 5);
  } else if (preset === 'mid') {
    mockFriends[0].total_top100_played = baseValue + 2;
    mockFriends[1].total_top100_played = baseValue + 1;
    mockFriends[2].total_top100_played = Math.max(0, baseValue - 1);
  } else if (preset === 'high') {
    mockFriends[0].total_top100_played = baseValue + 10;
    mockFriends[1].total_top100_played = baseValue + 5;
    mockFriends[2].total_top100_played = baseValue + 2;
  }
  
  return {
    me: realData?.me ?? null,
    friends: mockFriends,
  };
}

function presetToNumber(preset: MyJourneyPreset): number {
  switch (preset) {
    case 'none': return 0;
    case '5': return 5;
    case '20': return 20;
    case '50': return 50;
    case '100': return 100;
    case '200': return 200;
    default: return 0;
  }
}
