import { NearbyGolfer } from '../types';

/**
 * Sort golfers by priority:
 * 1. Open to Play (highest priority)
 * 2. Friends
 * 3. Same Home Club
 * 4. Distance (ascending)
 * 5. Recent Activity (descending)
 */
export function sortGolfers(golfers: NearbyGolfer[]): NearbyGolfer[] {
  return [...golfers].sort((a, b) => {
    // Priority 1: Open to Play
    const aOpen = a.isOpenToPlay ? 0 : 1;
    const bOpen = b.isOpenToPlay ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;

    // Priority 2: Friends (if we add is_friend field later)
    // const aFriend = a.is_friend ? 0 : 1;
    // const bFriend = b.is_friend ? 0 : 1;
    // if (aFriend !== bFriend) return aFriend - bFriend;

    // Priority 3: Same Home Club
    const aClub = a.same_club ? 0 : 1;
    const bClub = b.same_club ? 0 : 1;
    if (aClub !== bClub) return aClub - bClub;

    // Priority 4: Distance (ascending)
    const aDist = a.distance_km ?? 999999;
    const bDist = b.distance_km ?? 999999;
    if (Math.abs(aDist - bDist) > 0.01) return aDist - bDist;

    // Priority 5: Recent Activity (if we add last_active_at later)
    // const aTime = new Date(a.last_active_at ?? 0).getTime();
    // const bTime = new Date(b.last_active_at ?? 0).getTime();
    // return bTime - aTime;

    return 0;
  });
}
