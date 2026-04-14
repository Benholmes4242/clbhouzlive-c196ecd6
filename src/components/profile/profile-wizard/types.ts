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
  profilePhotoUrl: string | null;
  headerPhotoUrl: string | null;
  profilePhotoBlob: Blob | null;
  headerPhotoBlob: Blob | null;
  homeClubName: string;
  primaryClubId: string | null;
  additionalClubs: ClubEntry[];
  collegeNormalized: string | null;
  collegeId: string | null;
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
}

export const STEP_TITLES: Record<WizardStep, string> = {
  1: 'Photos & Identity',
  2: 'Golf Info',
  3: 'About You',
};

export const BIO_MAX = 300;
export const DISPLAY_NAME_MAX = 50;
export const USERNAME_MAX = 30;

// Business wizard types (backward compat)
export type BusinessWizardStep = 1 | 2 | 3;

export const BUSINESS_STEP_CONFIG: Record<BusinessWizardStep, { title: string; description: string }> = {
  1: { title: 'Identity', description: 'Tell golfers who you are' },
  2: { title: 'Find Us', description: 'Location, contact & opening hours' },
  3: { title: 'Branding', description: 'Logo, cover photo & preview' },
};
