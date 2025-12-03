export type Top100ListId = 'global' | 'gb-i' | 'usa' | 'europe';

export const TOP100_LIST_MILESTONES = [
  { threshold: 10,  id: '10',  label: '10 courses' },
  { threshold: 25,  id: '25',  label: '25 courses' },
  { threshold: 50,  id: '50',  label: '50 courses' },
  { threshold: 75,  id: '75',  label: '75 courses' },
  { threshold: 100, id: '100', label: 'List completed' },
] as const;

export type Top100ListMilestone = typeof TOP100_LIST_MILESTONES[number];

export const TOP100_LIST_META: {
  id: Top100ListId;
  name: string;
  shortLabel: string;
  emoji: string;
}[] = [
  { id: 'global', name: 'Global Top 100', shortLabel: 'Global', emoji: '🌍' },
  { id: 'gb-i', name: 'Britain & Ireland Top 100', shortLabel: 'GB&I', emoji: '🇬🇧' },
  { id: 'usa', name: 'USA Top 100', shortLabel: 'USA', emoji: '🇺🇸' },
  { id: 'europe', name: 'Continental Europe Top 100', shortLabel: 'Europe', emoji: '🇪🇺' },
];

/**
 * Get list metadata by ID
 */
export function getListMeta(listId: Top100ListId) {
  return TOP100_LIST_META.find(m => m.id === listId);
}
