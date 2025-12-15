/**
 * Golfer Verification Copy Strings
 * Centralized i18n/config file for all golfer verification-related UI copy
 * 
 * IMPORTANT: Golfer verification is INVITE-ONLY. Users cannot self-request.
 * Copy should reflect "Clbhouz would like to verify your account" pattern.
 */

export const golferVerificationCopy = {
  golferVerification: {
    // Notification titles
    invite: {
      title: "clbhouz would like to verify your account",
      body: "Based on your activity, you're eligible for verified golfer status.",
      reasonLabel: "Reason:"
    },
    inProgress: {
      title: "We're reviewing your verification",
      body: "Thanks for accepting. Our team is reviewing your details.",
      statusPill: "Verification in progress"
    },
    approved: {
      title: "You're now a verified golfer",
      body: "Your profile now shows a verified badge."
    },
    rejected: {
      title: "Verification not approved",
      body: "Your verification request was reviewed but not approved at this time.",
      reasonLabel: "Reason:"
    },
    removed: {
      title: "Golfer verification removed",
      body: "Your golfer verification has been removed.",
      reasonLabel: "Reason:"
    },
    declined: {
      title: "Invite declined",
      body: "You declined the verification invite. You may be invited again in the future."
    }
  },
  
  // Action buttons
  actions: {
    accept: "Accept verification",
    decline: "Not now",
    support: "Chat with support"
  },
  
  // Status pills
  statusPills: {
    pending: "Verification in progress",
    verified: "Verified",
    declined: "Invite declined",
    rejected: "Not approved"
  },
  
  // Tooltips
  tooltips: {
    verified: {
      title: "Verified Golfer",
      body: "This golfer has been verified by clbhouz."
    }
  }
} as const;

/**
 * i18n-ready Notification Copy System for Golfer Verification
 */
export type GolferVerificationEvent = 
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'approved'
  | 'rejected'
  | 'removed';

export interface GolferVerificationCopySet {
  title: string;
  body: string;
  push: string;
  audit: string;
}

export const GOLFER_VERIFICATION_COPY: Record<GolferVerificationEvent, GolferVerificationCopySet> = {
  invited: {
    title: 'clbhouz would like to verify your account',
    body: 'Based on your activity, you\'re eligible for verified golfer status.',
    push: 'You\'re invited to become a verified golfer',
    audit: 'Golfer verification invite sent.'
  },
  
  accepted: {
    title: 'We\'re reviewing your verification',
    body: 'Thanks for accepting. Our team is reviewing your details.',
    push: 'Verification in progress',
    audit: 'Golfer accepted verification invite.'
  },
  
  declined: {
    title: 'Invite declined',
    body: 'You declined the verification invite.',
    push: 'Verification invite declined',
    audit: 'Golfer declined verification invite.'
  },
  
  approved: {
    title: 'You\'re now a verified golfer',
    body: 'Your profile now shows a verified badge.',
    push: 'You\'re a verified golfer',
    audit: 'Golfer verification approved.'
  },
  
  rejected: {
    title: 'Verification not approved',
    body: 'Your verification request was reviewed but not approved at this time.',
    push: 'Verification not approved',
    audit: 'Golfer verification rejected.'
  },
  
  removed: {
    title: 'Golfer verification removed',
    body: 'Your golfer verification has been removed.',
    push: 'Verification removed',
    audit: 'Golfer verification removed by admin.'
  }
};

export const GOLFER_NOTIFICATION_TYPE_TO_EVENT: Record<string, GolferVerificationEvent> = {
  'golfer_verification_invite': 'invited',
  'golfer_verification_submitted': 'accepted',
  'golfer_verification_approved': 'approved',
  'golfer_verification_rejected': 'rejected',
  'golfer_verification_removed': 'removed'
};

export function getGolferVerificationCopy(event: GolferVerificationEvent | string): GolferVerificationCopySet {
  if (event in GOLFER_VERIFICATION_COPY) {
    return GOLFER_VERIFICATION_COPY[event as GolferVerificationEvent];
  }
  return GOLFER_VERIFICATION_COPY.invited; // Safe fallback
}
