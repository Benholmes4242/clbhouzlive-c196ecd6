// Hard disconnect: removes connection + ALL associated data. Cannot be undone.
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

  // All connections this user has ever had (in case there are orphans)
  const { data: allConns } = await admin
    .from("whs_connections")
    .select("id, vault_secret_id")
    .eq("user_id", user.id);

  const connectionIds = (allConns ?? []).map((c: any) => c.id);

  // Delete in dependency order. Some redundant due to CASCADE but explicit is safer.
  if (connectionIds.length > 0) {
    const { data: scoreIds } = await admin
      .from("whs_scores")
      .select("id")
      .in("connection_id", connectionIds);
    const scoreIdList = (scoreIds ?? []).map((s: any) => s.id);
    if (scoreIdList.length > 0) {
      await admin.from("whs_score_holes").delete().in("score_id", scoreIdList);
    }
    await admin.from("whs_scores").delete().in("connection_id", connectionIds);
    await admin.from("whs_handicap_snapshots").delete().in("connection_id", connectionIds);
    await admin.from("whs_friends").delete().in("connection_id", connectionIds);
  }

  await admin.from("whs_invites").delete().eq("inviter_user_id", user.id);
  await admin.from("whs_invite_completions").delete()
    .or(`inviter_user_id.eq.${user.id},invitee_user_id.eq.${user.id}`);

  if (connectionIds.length > 0) {
    await admin.from("whs_connections").delete().in("id", connectionIds);
  }

  for (const c of allConns ?? []) {
    if ((c as any).vault_secret_id) {
      try {
        await admin.rpc("vault_delete_secret", { secret_id: (c as any).vault_secret_id });
      } catch (err) {
        console.error("[delete-whs-data] vault delete failed (non-fatal):", err);
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    message: "All England Golf data deleted",
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
