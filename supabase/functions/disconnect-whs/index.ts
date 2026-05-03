// Soft disconnect: removes whs_connections row + Vault secret.
// Keeps all historical data so the user can reconnect and resume.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getAuthenticatedUser(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const userJwt = auth.slice(7);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${userJwt}` } } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "not_authenticated" }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = adminClient();

  const { data: conn } = await admin
    .from("whs_connections")
    .select("id, vault_secret_id")
    .eq("user_id", user.id)
    .eq("provider", "england_golf")
    .maybeSingle();

  if (!conn) {
    return new Response(JSON.stringify({ ok: true, message: "Already disconnected" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: delErr } = await admin
    .from("whs_connections")
    .delete()
    .eq("id", conn.id);
  if (delErr) {
    console.error("[disconnect-whs] connection delete failed:", delErr);
    return new Response(JSON.stringify({ ok: false, error: "disconnect_failed" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if ((conn as any).vault_secret_id) {
    try {
      await admin.rpc("vault_delete_secret", { secret_id: (conn as any).vault_secret_id });
    } catch (err) {
      console.error("[disconnect-whs] vault delete failed (non-fatal):", err);
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    message: "Disconnected — your historical data is kept. Reconnect any time to resume syncing.",
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
