import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve where a freshly authenticated user should land.
 * - No profile row or onboarding incomplete -> onboarding
 * - Otherwise -> redirect param if present, else home
 * On query failure, fail SAFE to onboarding-check bypass ('/')
 * rather than blocking sign-in.
 */
export async function resolvePostAuthRoute(
  userId: string,
  redirectPath?: string | null,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, has_completed_onboarding')
      .eq('id', userId)
      .maybeSingle();
    if (error) return redirectPath || '/';
    const hasProfile = !!data;
    const done = data?.has_completed_onboarding ?? false;
    if (!hasProfile || !done) return '/edit-profile?onboarding=1';
    return redirectPath || '/';
  } catch {
    return redirectPath || '/';
  }
}
