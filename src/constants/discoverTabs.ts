// New Discover tab system for Phase 1+
// Watch · Learn · Explore · Following

export type DiscoverTab = 'watch' | 'learn' | 'explore' | 'following';

export const DISCOVER_TABS: Array<{ id: DiscoverTab; label: string }> = [
  { id: 'watch', label: 'Watch' },
  { id: 'learn', label: 'Learn' },
  { id: 'explore', label: 'Explore' },
  { id: 'following', label: 'Following' },
];

export const DEFAULT_DISCOVER_TAB: DiscoverTab = 'watch';

// Map old main pills to new tabs for backwards compatibility
export const LEGACY_TO_NEW_TAB: Record<string, DiscoverTab> = {
  'shorts': 'watch',
  'videos': 'watch',
  'channels': 'watch', // Will be deprecated
  'following': 'following',
};
