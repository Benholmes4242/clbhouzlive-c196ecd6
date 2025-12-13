/**
 * Business Verification Copy Strings
 * Centralized i18n/config file for all verification-related UI copy
 */

export const businessVerificationCopy = {
  businessVerification: {
    sectionTitle: {
      default: "Business Verification",
      pending: "Verification in Progress",
      verified: "Your Business Is Verified",
      rejected: "Verification Not Approved"
    },
    description: {
      unverified: "Verification helps golfers trust that your business is authentic. Once verified, you'll receive a blue badge and greater visibility in the directory.",
      pending: "Thanks — your request has been received. Our team is reviewing your details. We'll notify you once a decision is made.",
      verified: "Your business now displays a verified badge across Clbhouz, including the directory, search results, and your profile.",
      rejected: "Your verification request wasn't approved. Review the notes below, update your profile, and request verification again."
    },
    requirementsTitle: "Before requesting verification, make sure your profile includes:",
    requirementsList: [
      "A clear business name",
      "A location",
      "A website or email",
      "A profile image or logo"
    ],
    adminNotesTitle: "Reason provided:",
    helperTextRejected: "Ensure your business details match your official information.",
    buttons: {
      requestVerification: "Request verification",
      requestVerificationDisabled: "Complete your profile to request verification",
      requestVerificationAgain: "Request Verification Again"
    },
    helperText: "Verification helps golfers trust the account is authentic.",
    tooltips: {
      requestDisabled: "Add a business name, location, and website or email to continue.",
      pendingDisabled: "A request is already in progress."
    },
    badges: {
      unverified: "Not verified",
      pending: "Verification pending",
      verified: "Official Business",
      rejected: "Rejected"
    },
    toasts: {
      requestSubmitted: "Verification request sent",
      requestUpdated: "Verification request updated",
      requestCancelled: "Verification request cancelled",
      requestFailed: "Could not submit your verification request. Please try again.",
      profileIncomplete: "Please complete your business profile before requesting verification.",
      cooldown: "You can request verification again in {days} days."
    },
    requestModal: {
      title: "Request verification",
      body: "Verify this business to show an Official Business badge across Clbhouz.",
      fields: {
        contactName: { label: "Contact name", placeholder: "Your name" },
        businessEmail: { label: "Business email", placeholder: "name@business.com" },
        proofLink: { label: "Proof link", placeholder: "Website, Companies House, or official social profile" },
        notes: { label: "Notes (optional)", placeholder: "Anything that helps us verify faster…" },
      },
      primaryCta: "Submit request",
      secondaryCta: "Cancel",
    },
  },
  badgeTooltips: {
    verified: {
      title: "Official Business",
      body: "This business has been verified by Clbhouz.",
    },
    pending: {
      title: "Verification pending",
      body: "We're reviewing this request. You'll be notified once it's complete.",
    },
    rejected: {
      title: "Verification not approved",
      body: "This request wasn't approved. You can submit a new request with more details.",
    },
  },
  adminVerification: {
    page: {
      title: "Business Verification Requests",
      subtitle: "Review and approve verification requests submitted by businesses on Clbhouz."
    },
    table: {
      columns: {
        business: "Business",
        category: "Category",
        location: "Location",
        contact: "Contact Details",
        website: "Website",
        requestedOn: "Requested On",
        status: "Status",
        actions: "Actions"
      }
    },
    statuses: {
      unverified: "Unverified",
      pending: "Pending Review",
      verified: "Verified",
      rejected: "Rejected"
    },
    actions: {
      approve: "Approve",
      reject: "Reject",
      viewProfile: "View Profile"
    },
    modals: {
      reject: {
        title: "Reject Verification Request",
        body: "If you'd like, you can provide a reason for rejecting this request. This may help the business update their profile before requesting again.",
        textareaPlaceholder: "Reason for rejection (optional)…",
        confirm: "Reject Request",
        cancel: "Cancel"
      },
      approve: {
        title: "Approve this business?",
        body: "This business will receive a verified badge and appear as verified across Clbhouz. Are you sure you want to approve this request?",
        confirm: "Approve",
        cancel: "Cancel"
      }
    },
    toasts: {
      approved: "Business verified successfully.",
      rejected: "Verification request rejected.",
      errorUpdate: "Could not update verification status. Please try again.",
      invalidWebsite: "This website link appears to be invalid."
    },
    nav: {
      menuLabel: "Business Verification",
      badgeTooltip: "There are verification requests awaiting review."
    },
    emptyState: {
      title: "No verification requests",
      body: "Business verification requests will appear here"
    }
  },
  notifications: {
    businessVerified: {
      title: "Your business is now verified",
      body: "Congratulations — your business has been verified on Clbhouz. You now display a verified badge and may receive increased visibility."
    },
    verificationPending: {
      title: "Verification request submitted",
      body: "We've received your request. We'll notify you once our team reviews your business details."
    },
    verificationRejected: {
      title: "Your verification request was not approved",
      body: "Your business verification request wasn't approved. You can update your profile and request verification again.",
      reasonLabel: "Reason provided:"
    }
  }
} as const;

// Type exports for TypeScript consumers
export type BusinessVerificationCopy = typeof businessVerificationCopy;
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/**
 * i18n-ready Notification Copy System
 * 
 * Translation key structure:
 *   business_verification.{event}.{field}
 * 
 * Example keys:
 *   business_verification.submitted.title
 *   business_verification.approved.body
 *   business_verification.removed.push
 *   business_verification.more_proof_requested.audit
 * 
 * Single source of truth for:
 * - Edge functions (notifications + audit logs)
 * - Frontend (title + body)
 * - Push service (push string)
 * - Audit logs (audit string)
 * - Email notifications (email_subject + email_body)
 */

export type BusinessVerificationEvent = 
  | 'submitted'
  | 'approved'
  | 'removed'
  | 'rejected'
  | 'more_proof_requested';

export interface VerificationCopySet {
  title: string;
  body: string;
  push: string;
  audit: string;
  email_subject?: string;
  email_body?: string;
}

/**
 * i18n-ready copy map with translation key paths
 * Keys follow pattern: business_verification.{event}.{field}
 */
export const BUSINESS_VERIFICATION_COPY: Record<BusinessVerificationEvent, VerificationCopySet> = {
  submitted: {
    title: 'Request received',
    body: 'Your verification request is being reviewed by our team.',
    push: 'Verification request received',
    audit: 'Verification request submitted by business owner.',
    email_subject: "We've received your verification request",
    email_body: "Your verification request is being reviewed by our team. We'll notify you once a decision is made."
  },

  approved: {
    title: "You're verified",
    body: 'Your business profile has been successfully verified.',
    push: 'Your business is now verified',
    audit: 'Business verification approved.',
    email_subject: 'Your business is now verified',
    email_body: 'Congratulations! Your business profile has been successfully verified. You now display a verified badge across Clbhouz.'
  },

  rejected: {
    title: 'Verification not approved',
    body: 'Your verification request was not approved at this time.',
    push: 'Verification not approved',
    audit: 'Business verification rejected.',
    email_subject: 'Verification update',
    email_body: 'Your verification request was not approved. You can update your profile and submit a new request.'
  },

  removed: {
    title: 'Verification status changed',
    body: 'Your business verification has been removed.',
    push: 'Business verification removed',
    audit: 'Business verification removed by admin.',
    email_subject: 'Verification status update',
    email_body: 'Your business verification has been removed. Contact support if you have questions.'
  },

  more_proof_requested: {
    title: 'More information needed',
    body: 'We need a little more information to complete your business verification.',
    push: 'More verification info needed',
    audit: 'Additional verification information requested by admin.',
    email_subject: 'Action needed: more information required',
    email_body: 'To complete your business verification, we need a little more information. Open Clbhouz to submit the requested details and continue the review.'
  }
};

/**
 * Get copy for a specific verification event
 */
export function getVerificationCopy(event: BusinessVerificationEvent): VerificationCopySet {
  return BUSINESS_VERIFICATION_COPY[event];
}

/**
 * Get i18n translation key for a specific field
 * Example: getVerificationTranslationKey('submitted', 'title') => 'business_verification.submitted.title'
 */
export function getVerificationTranslationKey(
  event: BusinessVerificationEvent, 
  field: keyof VerificationCopySet
): string {
  return `business_verification.${event}.${field}`;
}

/**
 * DB notification type to event mapping
 * Standardized notification types stored in DB:
 * - business_verification_submitted
 * - business_verification_approved
 * - business_verification_rejected
 * - business_verification_removed (canonical - use instead of revoked)
 * - business_verification_more_proof_requested
 */
export const NOTIFICATION_TYPE_TO_EVENT: Record<string, BusinessVerificationEvent> = {
  'business_verification_submitted': 'submitted',
  'business_verification_approved': 'approved',
  'business_verification_rejected': 'rejected',
  'business_verification_removed': 'removed',
  'business_verification_more_proof_requested': 'more_proof_requested',
  // Legacy support for existing notifications
  'business_verification_revoked': 'removed'
};

/**
 * Event to DB notification type mapping (for inserting notifications)
 */
export const EVENT_TO_NOTIFICATION_TYPE: Record<BusinessVerificationEvent, string> = {
  'submitted': 'business_verification_submitted',
  'approved': 'business_verification_approved',
  'rejected': 'business_verification_rejected',
  'removed': 'business_verification_removed',
  'more_proof_requested': 'business_verification_more_proof_requested'
};
