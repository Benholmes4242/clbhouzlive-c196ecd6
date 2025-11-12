import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { cors } from "../_shared/cors.ts";
import { verifyGateToken, signGateToken } from "../_shared/tokens.ts";

const handler = async (req: Request): Promise<Response> => {
  const rid = crypto.randomUUID();
  const headers = cors(req.headers.get('Origin'));

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  console.log(JSON.stringify({
    rid,
    fn: 'secure-site-access-check',
    method: req.method,
    origin: req.headers.get('Origin'),
    time: new Date().toISOString(),
    note: 'begin'
  }));

  try {
    const { token } = await req.json();
    
    if (!token) {
      console.log(JSON.stringify({ rid, status: 400, code: 'MISSING_TOKEN' }));
      return new Response(
        JSON.stringify({ ok: false, code: 'MISSING_TOKEN', message: 'No token provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // 1) Validate token signature + expiry (with ±60s skew tolerance)
    let claims;
    try {
      claims = await verifyGateToken(token, 60);
    } catch (e: any) {
      const code = String(e?.message || e);
      const status = code === 'TOKEN_EXPIRED' ? 401 : 401;
      
      console.log(JSON.stringify({ rid, status, code }));
      
      return new Response(
        JSON.stringify({ ok: false, code, message: `Token validation failed: ${code}` }),
        { status, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // 2) Optional: Verify admin role in database (for extra security)
    // This ensures token wasn't forged and user still has admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && svcKey) {
      const svc = createClient(supabaseUrl, svcKey);
      
      // Check if user still has admin membership
      const { data: mem } = await svc
        .from("admin_memberships")
        .select("role, expires_at")
        .eq("user_id", claims.sub)
        .maybeSingle();
      
      // If membership exists, verify it's still valid
      if (mem) {
        const notExpired = !mem.expires_at || new Date(mem.expires_at) > new Date();
        if (!notExpired) {
          console.log(JSON.stringify({ rid, status: 401, code: 'MEMBERSHIP_EXPIRED' }));
          return new Response(
            JSON.stringify({ ok: false, code: 'MEMBERSHIP_EXPIRED', message: 'Admin membership has expired' }),
            { status: 401, headers: { 'Content-Type': 'application/json', ...headers } }
          );
        }
      }
    }

    // 3) Re-issue a fresh token for sliding sessions
    // Renew if < 30 minutes remain
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = claims.exp - now;
    const shouldRenew = secondsLeft < 60 * 30; // <30m left
    
    const renewed = shouldRenew
      ? await signGateToken(claims.sub, claims.role, 60 * 60 * 24) // new 24h token
      : null;

    // Calculate final expiry
    let finalExp: number;
    if (renewed) {
      const renewedClaims = await verifyGateToken(renewed);
      finalExp = renewedClaims.exp;
    } else {
      finalExp = claims.exp;
    }

    const response = {
      ok: true,
      sessionToken: renewed || undefined,
      expiresAt: new Date(finalExp * 1000).toISOString(),
      user_id: claims.sub,
      role: claims.role,
      is_admin: true,
    };

    console.log(JSON.stringify({
      rid,
      status: 200,
      code: 'OK',
      renewed: !!renewed,
      expiresAt: response.expiresAt
    }));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    
  } catch (error: any) {
    const msg = String(error?.message || error);
    console.log(JSON.stringify({
      rid,
      status: 500,
      code: 'EDGE_ERROR',
      error: msg
    }));
    
    return new Response(
      JSON.stringify({ ok: false, code: 'EDGE_ERROR', message: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
};

serve(handler);
