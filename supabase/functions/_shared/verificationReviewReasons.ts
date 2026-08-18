/**
 * BRIEF_VERIFICATION_PHASE_4 §3.1 — THE DECISION REASONS.
 *
 * Tied to the published criteria at /legal/business-verification. Free text does
 * not aggregate; this list does. Mirrored on the client in
 * src/components/business/verification/reviewReasons.ts — keep the KEYS identical.
 *
 * The reason is OPTIONAL at this boundary: a pre-Phase-4 client that sends only
 * { request_id, admin_notes } must still get a decision.
 */
export const REVIEW_REASONS = [
  'below_bar',
  'document_illegible',
  'document_mismatch',
  'domain_not_business',
  'presence_unverifiable',
  'ownership_unclear',
  'duplicate',
  'other',
] as const;

export type ReviewReason = typeof REVIEW_REASONS[number];

/** What the APPLICANT is told. Written as a cause, followed by the remedy. */
export const REVIEW_REASON_APPLICANT: Record<string, { cause: string; fix: string }> = {
  below_bar: {
    cause: 'The request did not meet the two-signal bar.',
    fix: 'Add a second signal — a business domain or a document. Presence on its own is not enough.',
  },
  document_illegible: {
    cause: 'The document did not clearly show the business name.',
    fix: 'Upload a clearer copy where the business name is legible.',
  },
  document_mismatch: {
    cause: 'The name on the document did not match the business profile.',
    fix: 'Upload a document in the profile’s name, or correct the name on the profile.',
  },
  domain_not_business: {
    cause: 'The email address was not on the business’s own domain.',
    fix: 'Use an address on your own domain. A free mailbox provider is not a domain signal.',
  },
  presence_unverifiable: {
    cause: 'The website, listing or number could not be matched to the business.',
    fix: 'Give a live link or a published number that names the business.',
  },
  ownership_unclear: {
    cause: 'Your relationship to the business was unclear.',
    fix: 'Tell us your role, and provide evidence that connects you to the business.',
  },
  duplicate: {
    cause: 'This evidence is already verified under another business.',
    fix: 'If both businesses are genuinely yours, reply and tell us how they relate.',
  },
  other: { cause: '', fix: '' },
};
