import { supabase } from '@/integrations/supabase/client';

/** Same-user conversion must renew the JWT before profile writes/navigation.
 * Missing/anonymous refreshed sessions fail closed and leave sign-in retryable.
 */
export async function refreshGuestConversion(linked: boolean): Promise<void> {
  if (!linked) return;
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  if (!data.session || data.session.user.is_anonymous === true) {
    throw new Error('Guest conversion is not confirmed. Please try again.');
  }
}