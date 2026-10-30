/**
 * THE ONE GUEST DEFINITION. A guest is a session whose user.is_anonymous is
 * true — never inferred from a missing profile. Every guest surface reads
 * useIsGuest() (React) or getGuestUser() (non-React); nothing else decides.
 */
import type { User } from '@supabase/supabase-js';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { GUEST_BROWSING_ENABLED } from './guestConfig';

export function isGuestUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true;
}

export function useIsGuest(): boolean {
  const { user } = useSupabaseSession();
  return GUEST_BROWSING_ENABLED && isGuestUser(user);
}
