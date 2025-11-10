import { supabase } from "@/integrations/supabase/client";

export async function getUserIdByEmail(email: string): Promise<string | null> {
  // 1) Try edge function first (preferred - server-side, no PII exposure risk)
  try {
    const { data, error } = await supabase.functions.invoke("lookup-user-by-email", {
      body: { email },
    });
    if (!error && data?.user_id) {
      return data.user_id;
    }
  } catch (e) {
    console.warn("[getUserIdByEmail] Edge function failed, falling back to client lookup:", e);
  }

  // 2) Fallback to client-side public_profiles lookup
  try {
    const { data: profile, error: profileError } = await supabase
      .from("public_profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    
    if (!profileError && profile?.id) {
      return profile.id;
    }
  } catch (e) {
    console.error("[getUserIdByEmail] Client lookup failed:", e);
  }

  return null;
}
