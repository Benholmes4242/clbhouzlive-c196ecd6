import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve where a freshly authenticated user should land.
 * - No profile row or onboarding incomplete -> onboarding
 * - Otherwise -> redirect param if present, else home
 * On query failure, send the member to setup rather than bypassing it.
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
    if (error) return '/welcome';
    const hasProfile = !!data;
    const done = data?.has_completed_onboarding ?? false;
    if (!hasProfile || !done) return '/welcome';
    return redirectPath || '/';
  } catch {
    return '/welcome';
  }
}
