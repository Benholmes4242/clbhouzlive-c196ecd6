// Shared fail-closed gate for internal edge functions.
//
// Every internal cron/backfill/maintenance function should call this
// immediately after CORS preflight. Returns a Response to return
// immediately if the caller is not authorized, or null if the caller
// is authorized to proceed.
//
// FAIL CLOSED: if INTERNAL_FN_SECRET is not configured the function
// refuses to run (returns 500). This is intentional so a mis-deployed
// function cannot run unguarded.

export function requireInternalSecret(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const expected = Deno.env.get("INTERNAL_FN_SECRET");
  if (!expected) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: internal secret unset" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  const provided = req.headers.get("x-internal-secret");
  if (provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
