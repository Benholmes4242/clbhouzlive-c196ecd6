import { supabase } from "@/integrations/supabase/client";

export async function adminInvite(action: string, body: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-invite-manage", {
    body: { action, ...body },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
