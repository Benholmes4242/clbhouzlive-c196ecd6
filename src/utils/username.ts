import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve a username to a user id. Extracted from profileVideoPrefetch
 * so navigation code survives the video engine teardown.
 */
export async function resolveUsernameToId(
  username: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}
