/**
 * RSVP Label Mapping - Centralized labels for RSVP statuses
 * 
 * Use this mapping everywhere RSVP statuses are displayed.
 * This ensures consistent copy across the entire app.
 * 
 * Status → Label mapping:
 * - going    → "Joined"
 * - maybe    → "Maybe"
 * - declined → "Can't go"
 * - invited  → "Invited"
 */

export type RsvpStatus = 'going' | 'maybe' | 'declined' | 'invited';

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  going: 'Joined',
  maybe: 'Maybe',
  declined: "Can't go",
  invited: 'Invited',
};

/**
 * Get the display label for an RSVP status
 */
export function getRsvpLabel(status: RsvpStatus | null | undefined): string {
  if (!status) return '';
  return RSVP_LABELS[status] || status;
}

/**
 * Format a count with the correct RSVP label
 * e.g. formatRsvpCount(3, 'going') → "3 joined"
 */
export function formatRsvpCount(count: number, status: RsvpStatus): string {
  const label = RSVP_LABELS[status].toLowerCase();
  return `${count} ${label}`;
}

/**
 * RSVP button labels (for action buttons)
 */
export const RSVP_BUTTON_LABELS: Record<RsvpStatus, string> = {
  going: 'Joined',
  maybe: 'Maybe',
  declined: "Can't go",
  invited: 'Invited',
};
