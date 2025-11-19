/**
 * Mock golfer data for testing with exactly 2 golfers
 * 1. Andrew Yetzes (real user from DB)
 * 2. Gary Martyn (mock user)
 */

export const mockGolfers = [
  // Andrew Yetzes - Real user from database
  {
    id: '91339e15-1a6a-4a45-8a4b-3d032780e5eb',
    user_id: '91339e15-1a6a-4a45-8a4b-3d032780e5eb',
    display_name: 'Andrew Yetzes',
    username: 'andrewyetzes',
    profile_photo_url: 'https://media.clbhouz.co.uk/91339e15-1a6a-4a45-8a4b-3d032780e5eb/avatar.jpg',
    eg_handicap_index: 9.8,
    home_club: 'Sundridge Park Golf Club',
    distance_m: 160, // 0.1 miles = 160 meters
    open_to_play: false,
    latitude: 51.4,
    longitude: -0.6,
    updated_at: new Date().toISOString(),
    same_club: true, // Display "Same Home Club" pill
  },
  // Gary Martyn - Mock user (not in database)
  {
    id: 'mock-gary-martyn',
    user_id: 'mock-gary-martyn',
    display_name: 'Gary Martyn',
    username: 'garymartyn',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GaryMartyn',
    eg_handicap_index: 7.2,
    home_club: 'Chislehurst Golf Club',
    distance_m: 400, // 0.4 km = 400 meters (within default 0.5km radius)
    open_to_play: false,
    latitude: 51.41,
    longitude: -0.61,
    updated_at: new Date().toISOString(),
    same_club: false, // No "Same Home Club" pill
  },
];
