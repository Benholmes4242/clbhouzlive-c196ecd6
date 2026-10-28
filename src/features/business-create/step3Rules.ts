/**
 * BC3 — step 3 rules ("How do golfers reach you?"). Pure and render-free so
 * the step, the sheets and the tests share one definition. Everything here
 * reads the draft only; nothing is saved to the database in BC3.
 */
import { PRIMARY_ACTION_OPTIONS, type PrimaryActionKey, type SocialFields } from '@/components/business/editor/editorTypes';
import type { BusinessCreateDraft } from './createRules';

/** Which main-button chips are available, keyed on the detail behind each. */
export function mainButtonAvailability(draft: BusinessCreateDraft): Record<PrimaryActionKey, boolean> {
  return {
    book: !!draft.bookingUrl.trim(),
    call: !!draft.phone?.fullNumber,
    email: !!draft.email.trim(),
    website: !!draft.website.trim(),
    directions: !!draft.address,
  };
}

export function unavailableMainButtons(draft: BusinessCreateDraft): PrimaryActionKey[] {
  const avail = mainButtonAvailability(draft);
  return PRIMARY_ACTION_OPTIONS.map(o => o.key).filter(k => !avail[k]);
}

const MAIN_BUTTON_LABEL: Record<PrimaryActionKey, string> = {
  book: 'Book', call: 'Call', email: 'Email', website: 'Website', directions: 'Directions',
};

/**
 * Hint line under the chips: with exactly Book and Website missing, name them
 * ("Book and Website appear once you add their links."); any other unavailable
 * set gets the generic line; none unavailable → no hint.
 */
export function mainButtonHint(draft: BusinessCreateDraft): string | null {
  const missing = unavailableMainButtons(draft);
  if (missing.length === 0) return null;
  if (missing.length === 2 && missing.includes('book') && missing.includes('website')) {
    return `${MAIN_BUTTON_LABEL.book} and ${MAIN_BUTTON_LABEL.website} appear once you add their links.`;
  }
  return 'Greyed-out buttons need their detail added first.';
}

/** On-blur contact validation — one line under the card, only after blur. */
export function contactFieldError(field: 'email' | 'website' | 'bookingUrl', value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (field === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address.';
  }
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(v) ? null : 'Enter a valid link.';
}

/** Social row sub: the filled networks by name, or the full list when empty. */
const SOCIAL_DISPLAY: { field: keyof SocialFields; name: string }[] = [
  { field: 'instagram', name: 'Instagram' },
  { field: 'tiktok', name: 'TikTok' },
  { field: 'twitter', name: 'X' },
  { field: 'youtube', name: 'YouTube' },
  { field: 'facebook', name: 'Facebook' },
];

export function socialSummary(social: SocialFields): string {
  const filled = SOCIAL_DISPLAY.filter(s => social[s.field].trim()).map(s => s.name);
  return filled.length ? filled.join(', ') : 'Instagram, TikTok, X, YouTube, Facebook';
}

/** Facilities row sub: the first two chosen and "+N", or the invitation. */
export function facilitiesSummary(amenities: string[]): string {
  if (amenities.length === 0) return 'Choose what you offer';
  const first = amenities.slice(0, 2).join(', ');
  return amenities.length > 2 ? `${first} +${amenities.length - 2}` : first;
}

export function hoursSummary(showOpeningHours: boolean): string {
  return showOpeningHours ? 'Shown on your profile' : 'Off · not shown on your profile';
}
