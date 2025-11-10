import { supabase } from "@/integrations/supabase/client";

export async function getUserIdByEmail(email: string): Promise<string | null> {
  // Try public_profiles table - it uses 'id' as the user identifier
  const { data: profile, error: profileError } = await supabase
    .from("public_profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  
  if (!profileError && profile?.id) {
    return profile.id;
  }

  return null;
}
