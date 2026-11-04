/**
 * BRIEF_VERIFICATION_PHASE_5B §1.3 / §5.4 — reason keys the edge boundary
 * accepts. Mirrored on the client in
 * src/components/business/verification/revocationReasons.ts.
 */
import { REVIEW_REASONS } from './verificationReviewReasons.ts';

export const REVOCATION_ONLY_REASONS = [
  'business_closed',
  'ownership_changed',
  'misrepresentation',
  'granted_in_error',
] as const;

export const REVOCATION_REASONS = [...REVOCATION_ONLY_REASONS, ...REVIEW_REASONS] as const;

export const GOLFER_REASONS = [
  'not_notable',
  'identity_unconfirmed',
  'invited_in_error',
  'conduct',
  /* BRIEF 1 §8 — pro decline reasons (tour_pro / teaching_pro requests). */
  'not_on_tour_site',
  'not_pga_member',
  'details_mismatch',
  'other',
] as const;

export const REVOCATION_REASON_LABEL: Record<string, string> = {
  granted_in_error: 'The badge was granted in error.',
  business_closed: 'The business no longer trades.',
  ownership_changed: 'Ownership of the business has changed.',
  misrepresentation: 'The business was not as the evidence claimed.',
};

export const GOLFER_REASON_LABEL: Record<string, string> = {
  not_notable: 'The recognition bar was not met.',
  identity_unconfirmed: 'We could not confirm your identity.',
  invited_in_error: 'The invitation was sent in error.',
  conduct: 'Conduct on the platform.',
  not_on_tour_site: "We couldn't find you on the tour's site.",
  not_pga_member: 'We could not confirm a current membership with that PGA.',
  details_mismatch: "The details didn't match your profile.",
  other: '',
};
