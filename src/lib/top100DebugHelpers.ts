import type { Top100ProgressResponse } from '@/hooks/useTop100ProgressForUser';
import type { Top100FriendsSnapshotResponse } from '@/hooks/useTop100FriendsSnapshot';

type MyJourneyPreset = 'real' | 'none' | '5' | '20' | '50' | '100' | '200';
type FriendsPreset = 'real' | 'none' | 'low' | 'mid' | 'high';

export function applyMyJourneyDebug(
  realData: Top100ProgressResponse | null | undefined,
  preset: MyJourneyPreset
): Top100ProgressResponse | null | undefined {
  if (preset === 'real' || !realData) return realData;

  const target = presetToNumber(preset);
  
  // Determine prestige ring based on target
  let prestigeRing: 'bronze' | 'blue' | 'green' | 'silver' | 'gold' | 'platinum' | null = null;
  if (target >= 300) prestigeRing = 'platinum';
  else if (target >= 200) prestigeRing = 'gold';
  else if (target >= 100) prestigeRing = 'silver';
  else if (target >= 50) prestigeRing = 'green';
  else if (target >= 20) prestigeRing = 'blue';
  else if (target > 0) prestigeRing = 'bronze';
  
  // Create a simplified override
  const override: Top100ProgressResponse = {
    ...realData,
    total_played_top100: target,
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
    prestige_ring: prestigeRing,
    prestige_label: target >= 300 ? '300 Club Champion' : target >= 200 ? '200 Clubhouse Elite' : target >= 100 ? '100 Century Club' : target >= 50 ? '50 Club' : target >= 20 ? '20 Club' : target >= 5 ? 'Emerging Pilgrim' : null,
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
      me: realData.me,
      friends: [],
    };
  }
  
  // Generate fake friends based on preset
  const fakeFriends = generateFakeFriends(preset);
  
  return {
    me: realData.me,
    friends: fakeFriends,
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

function generateFakeFriends(preset: FriendsPreset) {
  const counts = {
    low: [10, 15, 18],
    mid: [40, 52, 58],
    high: [120, 200, 350],
  };
  
  const targets = counts[preset] || [0, 0, 0];
  
  return targets.map((count, idx) => ({
    friend_id: `debug-friend-${idx}`,
    display_name: `Debug Friend ${String.fromCharCode(65 + idx)}`,
    profile_photo_url: null,
    home_club: `Debug Club ${idx + 1}`,
    total_top100_played: count,
  }));
}
