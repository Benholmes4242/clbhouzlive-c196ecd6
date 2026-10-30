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
  // The conversion trigger creates the row; never invent a client fallback.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await supabase.from('user_profiles').select('id').eq('id', data.session.user.id).maybeSingle();
    if (result.error) throw result.error;
    if (result.data) return;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('Your profile is not ready yet. Please try again.');
}