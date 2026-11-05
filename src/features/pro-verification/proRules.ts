/**
 * BRIEF 1 (Pro verification) — pure rules for the request sheet, the member's
 * status derivation and the admin review card. No I/O in this module; the
 * sheet, Welcome, Edit profile, the Rounds gate and the admin queue all read
 * from here so the six signed-off surfaces cannot drift.
 */

export type ProKind = 'tour_pro' | 'teaching_pro';

export interface ProTourChip { label: string; code: string | null }

/** §2 — chip order is signed off. Tours with no code send p_tour_code null. */
export const PRO_TOUR_CHIPS: ProTourChip[] = [
  { label: 'PGA TOUR', code: 'pga' },
  { label: 'DP World Tour', code: 'euro' },
  { label: 'LPGA Tour', code: 'lpga' },
  { label: 'LIV Golf', code: 'liv' },
  { label: 'Korn Ferry Tour', code: 'pgad' },
  { label: 'HotelPlanner Tour', code: null },
  { label: 'Ladies European Tour', code: null },
  { label: 'PGA TOUR Champions', code: 'champ' },
  { label: 'Other tour', code: null },
];
export const OTHER_TOUR = 'Other tour';

export const PRO_PGA_BODIES = [
  'The PGA (GB&I)',
  'PGA of America',
  'PGA of Australia',
  'PGA of Canada',
  'Other PGA',
] as const;

export interface ProDetailsDraft {
  kind: ProKind;
  /** Chip label; OTHER_TOUR means the typed name in otherTour is sent. */
  tour: string;
  otherTour: string;
  link: string;
  noProfile: boolean;
  howToCheck: string;
  /** PGA body (teaching). */
  body: string;
  club: string;
  membershipNumber: string;
  coachingLink: string;
}

export const EMPTY_PRO_DRAFT: ProDetailsDraft = {
  kind: 'tour_pro',
  tour: '',
  otherTour: '',
  link: '',
  noProfile: false,
  howToCheck: '',
  body: '',
  club: '',
  membershipNumber: '',
  coachingLink: '',
};

/** §2 — the footer stays disabled until the same fields the RPC needs are in. */
export function proDraftValid(d: ProDetailsDraft): boolean {
  if (d.kind === 'tour_pro') {
    if (!d.tour) return false;
    if (d.tour === OTHER_TOUR && !d.otherTour.trim()) return false;
    return d.noProfile ? !!d.howToCheck.trim() : !!d.link.trim();
  }
  return !!d.body && !!d.club.trim();
}

export interface ProRequestArgs {
  p_kind: ProKind;
  p_tour?: string;
  /** §2 — tours with no code send p_tour_code null, never an omitted arg. */
  p_tour_code?: string | null;
  p_body?: string;
  p_club?: string;
  p_membership_number?: string;
  p_link?: string;
  p_no_profile?: boolean;
  p_how_to_check?: string;
}

export function proRequestArgs(d: ProDetailsDraft): ProRequestArgs {
  if (d.kind === 'tour_pro') {
    const chip = PRO_TOUR_CHIPS.find(c => c.label === d.tour);
    return {
      p_kind: 'tour_pro',
      p_tour: d.tour === OTHER_TOUR ? d.otherTour.trim() : d.tour,
      p_tour_code: d.tour === OTHER_TOUR ? null : chip?.code ?? null,
      p_link: d.noProfile ? undefined : d.link.trim(),
      p_no_profile: d.noProfile,
      p_how_to_check: d.noProfile ? d.howToCheck.trim() : undefined,
    };
  }
  return {
    p_kind: 'teaching_pro',
    p_body: d.body,
    p_club: d.club.trim(),
    p_membership_number: d.membershipNumber.trim() || undefined,
    p_link: d.coachingLink.trim() || undefined,
  };
}

/** The member's own request row (read through the gvr_select_own policy). */
export interface ProRequestRow {
  id: string;
  kind: string | null;
  status: string;
  pro_tour: string | null;
  pro_tour_code: string | null;
  pro_body: string | null;
  pro_club: string | null;
  pro_membership_number: string | null;
  pro_link: string | null;
  pro_no_profile: boolean | null;
  pro_how_to_check: string | null;
  pro_player_id: string | null;
  review_reason: string | null;
  created_at: string;
}

export function isProKind(kind: string | null | undefined): kind is ProKind {
  return kind === 'tour_pro' || kind === 'teaching_pro';
}

export function proKindLabel(kind: ProKind | null | undefined): string {
  return kind === 'teaching_pro' ? 'Teaching professional' : 'Tour professional';
}

/** §1 — display strings: kind plus the tour (tour_pro) or club (teaching_pro). */
export function proStatusLine(
  kind: ProKind | null | undefined,
  tour: string | null | undefined,
  club: string | null | undefined,
): string {
  const detail = kind === 'teaching_pro' ? club : tour;
  return detail ? `${proKindLabel(kind)} · ${detail}` : proKindLabel(kind);
}

/** §2 — reopening with a pending or declined request prefills every field. */
export function proDraftFromRequest(r: ProRequestRow): ProDetailsDraft {
  if (r.kind === 'teaching_pro') {
    return {
      ...EMPTY_PRO_DRAFT,
      kind: 'teaching_pro',
      body: r.pro_body ?? '',
      club: r.pro_club ?? '',
      membershipNumber: r.pro_membership_number ?? '',
      coachingLink: r.pro_link ?? '',
    };
  }
  const chip = PRO_TOUR_CHIPS.find(c => c.label === r.pro_tour && c.label !== OTHER_TOUR);
  return {
    ...EMPTY_PRO_DRAFT,
    kind: 'tour_pro',
    tour: chip ? chip.label : r.pro_tour ? OTHER_TOUR : '',
    otherTour: chip ? '' : r.pro_tour ?? '',
    link: r.pro_link ?? '',
    noProfile: !!r.pro_no_profile,
    howToCheck: r.pro_how_to_check ?? '',
  };
}

/** §7 — the pro half of the shared Rounds-gate predicate. */
/** 'unknown' = the profile or the request read is still unresolved; the gate
 *  must not decide on it. A failed request read is settled and counts as
 *  'none' (fail open). */
export type ProGateStatus = 'none' | 'pending' | 'verified' | 'unknown';
export function proGateStatus(s: { verified: boolean; pending: boolean; unknown?: boolean }): ProGateStatus {
  if (s.verified) return 'verified';
  if (s.unknown) return 'unknown';
  return s.pending ? 'pending' : 'none';
}

/** §8 — pro decline reasons. The keys are accepted by the edge boundary
 *  (mirrored in supabase/functions/_shared/verificationRevocationReasons.ts). */
export const PRO_DECLINE_REASON_OPTIONS = [
  { value: 'not_on_tour_site', label: "Couldn't find you on the tour's site", hint: 'The tour profile link does not check out' },
  { value: 'not_pga_member', label: 'Not a current member of that PGA', hint: "The PGA's own directory does not list them" },
  { value: 'details_mismatch', label: "Details don't match your profile", hint: 'Name, club or tour do not line up' },
  { value: 'other', label: 'Other', hint: 'Free text required' },
] as const;

/** §8 — the admin decision record names the pro reason, not its key. */
export function proDeclineReasonLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return PRO_DECLINE_REASON_OPTIONS.find(r => r.value === value)?.label ?? value;
}

/** §5 — the Edit profile "Not verified" row: the review reason in plain words. */
export function proDeclineReasonText(reason: string | null | undefined, tour?: string | null): string {
  switch (reason) {
    case 'not_on_tour_site':
      return tour ? `We couldn't find you on the ${tour}'s site.` : "We couldn't find you on the tour's site.";
    case 'not_pga_member':
      return "We couldn't confirm a current membership with that PGA.";
    case 'details_mismatch':
      return "The details didn't match your profile.";
    default:
      return 'Your pro verification was declined.';
  }
}

/** §8 — the checklist line on the admin card, per kind. */
export function proChecklistLine(kind: ProKind | null | undefined): string {
  return kind === 'teaching_pro'
    ? "Check: the club and membership number against the PGA's own directory."
    : "Check: the link is on the tour's own site, the name and photo match the profile, and the player is current.";
}
