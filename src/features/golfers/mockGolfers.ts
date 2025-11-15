/**
 * Mock golfer data for front-end visual testing
 * Now fetches from mock_profile_clones table (real user data clones)
 * To disable: set mock flag to false in mockSwitch.ts
 */

import { supabase } from '@/integrations/supabase/client';

// Fetch mock golfers from the database
let cachedMockGolfers: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchMockGolfers() {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (cachedMockGolfers.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return cachedMockGolfers;
  }

  try {
    const { data: mockClones, error } = await supabase
      .from('mock_profile_clones')
      .select('*')
      .limit(15);

    if (error) {
      console.error('Error fetching mock profile clones for golfers:', error);
      return [];
    }

    // Transform to golfer format with randomized data
    const transformed = (mockClones || []).map((clone, i) => ({
      id: clone.id,
      display_name: clone.display_name || 'User',
      username: clone.username,
      profile_photo_url: clone.profile_photo_url,
      home_club: clone.home_club || null,
      distance_m: Math.floor(Math.random() * 15000) + 500, // 0.5km - 15km
      open_to_play: Math.random() > 0.7, // 30% are open to play
      same_club: Math.random() > 0.8, // 20% same club
      eg_handicap_index: Math.random() > 0.5 ? Math.floor(Math.random() * 30) : null,
    }));

    cachedMockGolfers = transformed;
    cacheTimestamp = now;
    
    return transformed;
  } catch (err) {
    console.error('Failed to fetch mock golfers:', err);
    return [];
  }
}

// For backwards compatibility, export a sync getter that returns cached data
// Components should call fetchMockGolfers() once on mount
export const mockGolfers: any[] = cachedMockGolfers;
