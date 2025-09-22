// Coach-related types for the swing sharing system

export interface CoachProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  regionCode: string;
  specialties: string[];
  pricingNote?: string;
  bio?: string;
  status: 'active' | 'inactive';
  lat?: number;
  lng?: number;
  distance?: number; // calculated distance in km
  createdAt: string;
  updatedAt: string;
}

export interface CoachRegion {
  id: string;
  regionCode: string;
  name: string;
  country: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export interface SwingShare {
  id: string;
  analysisId: string;
  userId: string;
  coachId: string;
  status: 'pending' | 'sent' | 'accepted' | 'replied' | 'closed';
  consentFlags: {
    shareVideo: boolean;
    shareVisuals: boolean;
    shareAnalysis: boolean;
    shareContact: boolean;
  };
  accessToken?: string;
  tokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoachFeedback {
  id: string;
  shareId: string;
  coachId: string;
  author: 'coach' | 'system';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface CoachSearchParams {
  postcode?: string;
  regionCode?: string;
  radiusKm?: number;
  specialties?: string[];
  lat?: number;
  lng?: number;
}

export interface ShareConsentOptions {
  shareVideo: boolean;
  shareVisuals: boolean;
  shareAnalysis: boolean;
  shareContact: boolean;
}

export interface CoachReviewThread {
  share: SwingShare;
  coach: CoachProfile;
  feedback: CoachFeedback[];
}