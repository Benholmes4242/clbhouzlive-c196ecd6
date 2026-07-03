// Profile video prefetch — inert (Stage C, BRIEF_VIDEO_TEARDOWN.md).
// Video prefetch is severed; keep exports so hover/link callers compile.
// resolveUsernameToId is unrelated to playback and is left functional.

import { supabase } from '@/integrations/supabase/client';

export async function prefetchProfileVideos(_userId?: string | null): Promise<string[] | null> {
  return null;
}

export function resetProfilePrefetch(): void {
  // no-op
}

export async function resolveUsernameToId(username: string): Promise<string | null> {
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
