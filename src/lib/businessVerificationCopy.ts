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
      requestVerification: "Request Verification",
      requestVerificationDisabled: "Complete your profile to request verification",
      requestVerificationAgain: "Request Verification Again"
    },
    tooltips: {
      requestDisabled: "Add a business name, location, and website or email to continue.",
      pendingDisabled: "A request is already in progress."
    },
    badges: {
      unverified: "Unverified",
      pending: "Pending Review",
      verified: "Verified",
      rejected: "Rejected"
    },
    toasts: {
      requestSubmitted: "Verification request submitted.",
      requestFailed: "Could not submit your verification request. Please try again.",
      profileIncomplete: "Please complete your business profile before requesting verification.",
      cooldown: "You can request verification again in {days} days."
    }
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
