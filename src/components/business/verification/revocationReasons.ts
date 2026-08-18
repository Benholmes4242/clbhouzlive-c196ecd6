/**
 * BRIEF_VERIFICATION_PHASE_5B §1.3 — REVOCATION REASONS.
 *
 * Phase 4's decision list, plus the four entries that only make sense once a
 * badge has already been granted. Mirrored in
 * supabase/functions/_shared/verificationRevocationReasons.ts — keep the KEYS
 * identical.
 *
 * `granted_in_error` is the important one (§1.4): Phase 4 made a decision
 * terminal, and this is the honest reversal.
 */
import { REVIEW_REASON_OPTIONS, type ReviewReason } from './reviewReasons';

export const REVOCATION_ONLY_REASONS = [
  'business_closed',
  'ownership_changed',
  'misrepresentation',
  'granted_in_error',
] as const;

export type RevocationOnlyReason = typeof REVOCATION_ONLY_REASONS[number];
export type RevocationReason = ReviewReason | RevocationOnlyReason;

export const REVOCATION_REASON_OPTIONS: { value: RevocationReason; label: string; hint: string }[] = [
  { value: 'granted_in_error', label: 'Granted in error', hint: 'The badge should not have been issued — reverses a mistaken approval' },
  { value: 'business_closed', label: 'Business closed', hint: 'The business no longer trades' },
  { value: 'ownership_changed', label: 'Ownership changed', hint: 'The verified party no longer owns the business' },
  { value: 'misrepresentation', label: 'Misrepresentation', hint: 'The business is not what the evidence claimed' },
  ...REVIEW_REASON_OPTIONS,
];

export function revocationReasonLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return REVOCATION_REASON_OPTIONS.find((r) => r.value === value)?.label ?? value;
}

/** Only 'other' cannot carry itself. Same rule as Phase 4. */
export function revocationReasonRequiresNote(reason: RevocationReason | null): boolean {
  return reason === 'other';
}

/**
 * §5.4 — declining or removing a golfer. The business list does not apply: a
 * golfer supplies no evidence and no domain.
 */
export const GOLFER_REASONS = [
  'not_notable',
  'identity_unconfirmed',
  'invited_in_error',
  'conduct',
  'other',
] as const;

export type GolferReason = typeof GOLFER_REASONS[number];

export const GOLFER_REASON_OPTIONS: { value: GolferReason; label: string; hint: string }[] = [
  { value: 'not_notable', label: 'Not notable', hint: 'Does not meet the recognition bar' },
  { value: 'identity_unconfirmed', label: 'Identity unconfirmed', hint: 'We could not confirm this is who they say they are' },
  { value: 'invited_in_error', label: 'Invited in error', hint: 'The invitation should not have been sent' },
  { value: 'conduct', label: 'Conduct', hint: 'Behaviour on the platform' },
  { value: 'other', label: 'Other', hint: 'Free text required' },
];

export function golferReasonLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return GOLFER_REASON_OPTIONS.find((r) => r.value === value)?.label ?? value;
}
