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
 * Enum-based notification copy map (authoritative, future-proof)
 * Single source of truth for all verification events across:
 * - Edge functions (notifications + audit logs)
 * - Frontend (title + body)
 * - Push service (push string)
 * - Audit logs (audit string)
 */
export type BusinessVerificationEvent = 
  | 'verification_submitted'
  | 'verification_approved'
  | 'verification_removed';

export interface VerificationCopySet {
  title: string;
  body: string;
  push: string;
  audit: string;
}

export const BUSINESS_VERIFICATION_COPY: Record<BusinessVerificationEvent, VerificationCopySet> = {
  verification_submitted: {
    title: 'Request received',
    body: 'Your verification request is being reviewed by our team.',
    push: 'Verification request received',
    audit: 'Verification request submitted by business owner.'
  },

  verification_approved: {
    title: "You're verified",
    body: 'Your business profile has been successfully verified.',
    push: 'Your business is now verified',
    audit: 'Business verification approved.'
  },

  verification_removed: {
    title: 'Verification status changed',
    body: 'Your business verification has been removed.',
    push: 'Business verification removed',
    audit: 'Business verification removed by admin.'
  }
};

/**
 * Get copy for a specific verification event
 */
export function getVerificationCopy(event: BusinessVerificationEvent): VerificationCopySet {
  return BUSINESS_VERIFICATION_COPY[event];
}

/**
 * Notification type to event mapping (for frontend rendering)
 */
export const NOTIFICATION_TYPE_TO_EVENT: Record<string, BusinessVerificationEvent> = {
  'business_verification_submitted': 'verification_submitted',
  'business_verification_approved': 'verification_approved',
  'business_verification_revoked': 'verification_removed'
};
