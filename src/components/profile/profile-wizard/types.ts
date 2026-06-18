// Personal wizard types
export type WizardStep = 1 | 2 | 3;
export type WizardDirection = 'forward' | 'back';

export interface WebsiteEntry {
  id: string;
  url: string;
}

export interface ClubEntry {
  id: string;
  name: string;
  clubId?: string;
}

export interface ProfileFormData {
  displayName: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  headerPhotoUrl: string | null;
  profilePhotoBlob: Blob | null;
  headerPhotoBlob: Blob | null;
  homeClubName: string;
  primaryClubId: string | null;
  additionalClubs: ClubEntry[];
  /** MANUAL handicap entry — maps to user_profiles.manual_handicap_index. NEVER the WHS value. */
  handicapIndex: string;
  homeClubVisibility: string;
  additionalClubsVisibility: string;
  bio: string;
  websites: WebsiteEntry[];
  instagramHandle: string;
  twitterHandle: string;
  tiktokHandle: string;
  youtubeHandle: string;
  country: string;
  city: string;
  isPublic: boolean;
  gender: string;
  /** Champions / Crown Holders appearance — 'everyone' | 'friends' | 'nobody'. */
  championsVisibility: string;
  /** Handicap page stats + peer comparison visibility — 'everyone' | 'friends' | 'nobody'. */
  handicapPageVisibility: string;
}

export const STEP_TITLES: Record<WizardStep, string> = {
  1: 'Photos & Identity',
  2: 'Golf Info',
  3: 'About You',
};

export const BIO_MAX = 300;
export const DISPLAY_NAME_MAX = 50;
export const USERNAME_MAX = 30;

// Business wizard types removed in Phase 3 — see BusinessProfileEditor.tsx.

