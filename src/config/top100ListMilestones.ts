export type Top100ListId = 'global' | 'gb-i' | 'usa' | 'europe';

export const TOP100_LIST_MILESTONES = [
  { threshold: 5,   id: '5',   label: '5 courses' },
  { threshold: 10,  id: '10',  label: '10 courses' },
  { threshold: 20,  id: '20',  label: '20 courses' },
  { threshold: 30,  id: '30',  label: '30 courses' },
  { threshold: 40,  id: '40',  label: '40 courses' },
  { threshold: 50,  id: '50',  label: '50 courses' },
  { threshold: 60,  id: '60',  label: '60 courses' },
  { threshold: 70,  id: '70',  label: '70 courses' },
  { threshold: 80,  id: '80',  label: '80 courses' },
  { threshold: 90,  id: '90',  label: '90 courses' },
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
  { id: 'gb-i', name: 'GB&I Top 100', shortLabel: 'GB&I', emoji: '🇬🇧' },
  { id: 'usa', name: 'USA Top 100', shortLabel: 'USA', emoji: '🇺🇸' },
  { id: 'europe', name: 'Europe Top 100', shortLabel: 'Europe', emoji: '🇪🇺' },
];

/**
 * Get list metadata by ID
 */
export function getListMeta(listId: Top100ListId) {
  return TOP100_LIST_META.find(m => m.id === listId);
}
