export const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Day = typeof DAYS_ORDER[number];

export interface OpeningHoursEntry {
  open: string;
  close: string;
  closed: boolean;
}
export type OpeningHours = Record<string, OpeningHoursEntry>;

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  Mon: { open: '08:00', close: '18:00', closed: false },
  Tue: { open: '08:00', close: '18:00', closed: false },
  Wed: { open: '08:00', close: '18:00', closed: false },
  Thu: { open: '08:00', close: '18:00', closed: false },
  Fri: { open: '08:00', close: '18:00', closed: false },
  Sat: { open: '08:00', close: '18:00', closed: false },
  Sun: { open: '08:00', close: '18:00', closed: true },
};

export const SOCIAL_PLATFORMS = [
  { field: 'instagram', label: 'Instagram', placeholder: '@yourhandle', icon: '📸' },
  { field: 'twitter', label: 'X / Twitter', placeholder: '@yourhandle', icon: '𝕏' },
  { field: 'facebook', label: 'Facebook', placeholder: 'facebook.com/…', icon: 'ƒ' },
  { field: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/…', icon: '▶' },
] as const;

export interface SocialFields {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
}

export interface ImageState {
  url: string | null;
  pendingFile: File | null;
  pendingRemove: boolean;
  localPreview: string | null;
}

export const emptyImage: ImageState = {
  url: null,
  pendingFile: null,
  pendingRemove: false,
  localPreview: null,
};
