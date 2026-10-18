/**
 * ARCHITECTURE RULE (moved from AGENTS.md)
 * - DECIDING A MEMBER'S INDEX IS resolveDisplayHandicap's JOB AND NO ONE ELSE'S. Loading eg_handicap_index and manual_handicap_index to display, edit or save them is fine. Choosing between them — coalescing, falling back from one to the other, or treating a present manual figure as the index of a connected member — is not. A connection without a synced index means the index is UNKNOWN, not the manual figure. board_pool's 'near' band coalesces the two columns in SQL and so does not follow this rule; today every member with rounds has a synced index, so the two agree. If that stops being true, the function needs the same rule.
 *   - NOTE: an app-wide check of which readers CHOOSE between the columns rather than merely loading them has not been done. Start from this list: ProfilePageV2, ManageProfile, useUserProfile, useUserByUsername, useProfileSave, useProfileForm, profile-wizard/types, SettingsTabContent, RoundDetailSheet, usePostLikers, useEchoSuggestions, admin useUsers, review-island/overrides, types/profile, lib/supabase/selects.
 */

/**
 * Resolve which handicap to DISPLAY.
 *
 * A CONNECTED account's handicap comes from the federation, full stop. When a
 * WHS connection is active we return eg_handicap_index and NEVER fall back to
 * manual_handicap_index — a stale manual figure surfacing for a connected
 * member is the exact failure mode this rule eliminates. A null eg value on a
 * connected account means "not synced yet", not "use the manual number".
 *
 * Manual entry survives only for members with no connection.
 */
export interface ResolveHandicapInput {
  egHandicapIndex: number | null | undefined;
  manualHandicapIndex: number | null | undefined;
  hasWhsConnection: boolean;
}

export interface ResolvedHandicap {
  value: number | null;
  source: 'whs' | 'manual' | 'none';
}

export function resolveDisplayHandicap(args: ResolveHandicapInput): ResolvedHandicap {
  if (args.hasWhsConnection) {
    return args.egHandicapIndex != null
      ? { value: args.egHandicapIndex, source: 'whs' }
      : { value: null, source: 'whs' };
  }
  if (args.manualHandicapIndex != null) {
    return { value: args.manualHandicapIndex, source: 'manual' };
  }
  return { value: null, source: 'none' };
}

