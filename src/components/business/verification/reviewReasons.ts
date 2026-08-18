/**
 * BRIEF_VERIFICATION_PHASE_4 §3.1 — THE DECISION REASONS.
 *
 * Tied to the published criteria at /legal/business-verification. Keys are
 * mirrored in supabase/functions/_shared/verificationReviewReasons.ts, which is
 * what the edge functions validate against — keep the two in step.
 *
 * CORRECTED from the brief:
 *  - `duplicate` sits with the duplicate-proof check (§2), so its reviewer label
 *    names the conflict rather than restating the rule.
 *  - `other` is the only reason that REQUIRES free text; the note is optional
 *    (but recommended) on the rest, because the reason already carries the cause.
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

/** Reviewer-facing list. Order is decision order: bar first, then evidence. */
export const REVIEW_REASON_OPTIONS: { value: ReviewReason; label: string; hint: string }[] = [
  { value: 'below_bar', label: 'Below the bar', hint: 'Fewer than two signals, or presence only' },
  { value: 'document_illegible', label: 'Document illegible', hint: 'The document did not clearly show the business name' },
  { value: 'document_mismatch', label: 'Document name mismatch', hint: 'The name on the document did not match the profile' },
  { value: 'domain_not_business', label: 'Not a business domain', hint: 'The email was not on the business’s own domain' },
  { value: 'presence_unverifiable', label: 'Presence unverifiable', hint: 'The website, listing or number could not be matched' },
  { value: 'ownership_unclear', label: 'Ownership unclear', hint: 'The applicant’s relationship to the business is unclear' },
  { value: 'duplicate', label: 'Duplicate', hint: 'Already verified under another business' },
  { value: 'other', label: 'Other', hint: 'Free text required' },
];

export function reviewReasonLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return REVIEW_REASON_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

/** Applicant-facing cause + remedy. Phase 3's declined state reads this. */
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

/** True when the list cannot carry the decision on its own. */
export function reasonRequiresNote(reason: ReviewReason | null): boolean {
  return reason === 'other';
}
