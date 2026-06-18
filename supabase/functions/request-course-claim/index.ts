import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ADMIN_EMAILS = Deno.env.get("BUSINESS_VERIFICATION_ADMIN_EMAILS") || "support@clbhouz.co.uk";

function classifyRpcError(msg: string): { status: number; error: string } {
  const m = (msg || "").toLowerCase();
  if (m.includes("already claimed")) return { status: 409, error: msg };
  if (m.includes("already under review") || m.includes("already pending")) return { status: 409, error: msg };
  if (m.includes("not authorized") || m.includes("not authorised") || m.includes("permission")) {
    return { status: 403, error: msg };
  }
  return { status: 500, error: msg };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { business_id, club_id, club_key, source_course_id, proof_note } = body || {};

    if (!business_id) {
      return new Response(JSON.stringify({ ok: false, error: "Missing business_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped client so auth.uid() resolves inside the SECURITY DEFINER RPC
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: rpcData, error: rpcErr } = await supabaseUser.rpc("request_course_claim", {
      _business_id: business_id,
      _club_id: club_id ?? null,
      _club_key: club_key ?? null,
      _source_course_id: source_course_id ?? null,
      _proof_note: proof_note ?? null,
    });

    if (rpcErr) {
      console.error("request_course_claim RPC failed:", rpcErr);
      const c = classifyRpcError(rpcErr.message || "");
      return new Response(JSON.stringify({ ok: false, error: c.error }), {
        status: c.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort admin notify email via Resend (do NOT block on failure)
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const { data: biz } = await supabaseAdmin
          .from("business_accounts")
          .select("id, name")
          .eq("id", business_id)
          .maybeSingle();
        const businessName = biz?.name ?? business_id;
        const clubLabel = club_key ?? club_id ?? source_course_id ?? "(unknown course)";
        const recipients = ADMIN_EMAILS.split(",").map((s) => s.trim()).filter(Boolean);

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Clbhouz <noreply@clbhouz.co.uk>",
            to: recipients,
            subject: `New course claim request — ${businessName}`,
            html: `<p><strong>${businessName}</strong> has requested to claim a course on Clbhouz.</p>
              <p><strong>Course:</strong> ${clubLabel}</p>
              ${proof_note ? `<p><strong>Proof note:</strong> ${String(proof_note).replace(/[<>]/g, "")}</p>` : ""}
              <p>Review in the admin dashboard.</p>`,
          }),
        }).catch((e) => console.error("[request-course-claim] admin notify failed", e));
      }
    } catch (e) {
      console.error("[request-course-claim] admin notify threw", e);
    }

    return new Response(JSON.stringify({ ok: true, request_id: rpcData ?? null }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("request-course-claim error:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
