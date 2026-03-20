import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors } from "../_shared/cors.ts";
import { signGateToken } from "../_shared/tokens.ts";

const BACKOFF_STEPS = [1, 2, 4, 8, 16]; // seconds
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AccessValidationRequest {
  accessCode: string;
  domain: string;
}

// Verify a hash in the form: pbkdf2$sha256$<iters>$<salt_b64>$<dk_b64>
async function verifyPBKDF2(scheme: string, rawCode: string) {
  try {
    const [alg, hash, iterStr, saltB64, dkB64] = scheme.split('$').slice(1);
    if (alg !== 'sha256' || !iterStr || !saltB64 || !dkB64) return false;

    const iterations = parseInt(iterStr, 10);
    
    // Base64url decode
    const base64Decode = (str: string): Uint8Array => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const binary = atob(padded);
      return Uint8Array.from(binary, c => c.charCodeAt(0));
    };
    
    const base64Encode = (bytes: Uint8Array): string => {
      const bin = String.fromCharCode(...bytes);
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };
    
    const salt = base64Decode(saltB64);
    const codeKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(rawCode.toUpperCase()),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      codeKey,
      256 // 32 bytes
    );
    const derived = new Uint8Array(bits);
    const derivedB64 = base64Encode(derived);
    return crypto.timingSafeEqual
      ? crypto.timingSafeEqual(base64Decode(derivedB64), base64Decode(dkB64))
      : derivedB64 === dkB64; // fallback if timingSafeEqual not present
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const rid = crypto.randomUUID();
  const corsHeaders = cors(req.headers.get('Origin'));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  console.log(JSON.stringify({
    rid,
    fn: 'secure-site-access',
    method: req.method,
    origin: req.headers.get('Origin'),
    time: new Date().toISOString(),
    note: 'begin'
  }));

  try {
    const body = await req.json();

    // ── Path A: Auth-grant for verified users ──────────────────────────
    // AuthCallback sends { authGrant: true } + Authorization: Bearer <jwt>
    // Verify the Supabase JWT server-side and issue a gate token.
    if (body.authGrant === true) {
      const authHeader = req.headers.get('Authorization');
      const jwt = authHeader?.replace('Bearer ', '');

      if (!jwt) {
        return new Response(
          JSON.stringify({ success: false, message: 'Missing auth token' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: { user }, error: authErr } = await adminClient.auth.getUser(jwt);

      if (authErr || !user) {
        console.warn(`❌ Auth-grant rejected — invalid JWT, rid: ${rid}`);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid auth token' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Require confirmed email — block unverified sessions from self-granting
      if (!user.email_confirmed_at) {
        console.warn(`❌ Auth-grant rejected — email not confirmed, user: ${user.id}, rid: ${rid}`);
        return new Response(
          JSON.stringify({ success: false, message: 'Email not verified' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      console.log(`✅ Auth-grant for verified user ${user.id}, rid: ${rid}`);

      const signedToken = await signGateToken(
        user.id,
        'user',
        SESSION_TTL_MS / 1000
      );
      const { verifyGateToken } = await import('../_shared/tokens.ts');
      const claims = await verifyGateToken(signedToken);
      const expiresAt = new Date(claims.exp * 1000).toISOString();

      return new Response(
        JSON.stringify({ success: true, message: 'Access granted', sessionToken: signedToken, expiresAt }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    // ── End Path A ─────────────────────────────────────────────────────

    // ── Path B: Access-code grant (existing logic) ────────────────────
    const { accessCode, domain }: AccessValidationRequest = body;

    // Get client IP for rate limiting
    const clientIP = req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
    
    console.log(`Secure site access attempt from IP: ${clientIP}, domain: ${domain}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing attempts and apply progressive backoff
    const { data: attemptRow } = await supabase
      .from("site_gate_attempts")
      .select("*")
      .eq("ip", clientIP)
      .maybeSingle();

    // Get hashed access codes from environment
    const hashes = [
      Deno.env.get("SITE_ACCESS_CODE_PRIMARY_HASH"),
    ].filter(Boolean) as string[];

    // TEMPORARY: Plaintext fallback for debugging
    const plaintextFallback = ["CLBHOUZ2025*"];

    // Verify access code against plaintext first (for debugging)
    let isValid = false;
    
    if (accessCode && plaintextFallback.some(code => code === String(accessCode).toUpperCase())) {
      console.log("✅ Valid plaintext code matched");
      isValid = true;
    }
    
    // Then check PBKDF2 hashes if configured
    if (!isValid && accessCode && hashes.length) {
      console.log(`Checking ${hashes.length} PBKDF2 hash(es)`);
      for (const scheme of hashes) {
        if (scheme.startsWith("pbkdf2$sha256$")) {
          if (await verifyPBKDF2(scheme, String(accessCode))) {
            console.log("✅ Valid PBKDF2 hash matched");
            isValid = true;
            break;
          }
        }
      }
    }

    if (!isValid) {
      console.warn(`❌ Invalid code attempt - IP: ${clientIP}`);
    }

    if (!isValid) {
      // Increment failure count
      const failCount = (attemptRow?.fail_count ?? 0) + 1;
      const backoffSeconds = BACKOFF_STEPS[Math.min(failCount - 1, BACKOFF_STEPS.length - 1)];

      await supabase
        .from("site_gate_attempts")
        .upsert({ 
          ip: clientIP, 
          fail_count: failCount, 
          last_failed_at: new Date().toISOString() 
        });

      console.warn(`Failed access attempt - IP: ${clientIP}, failures: ${failCount}`);

      // Apply backoff delay
      await new Promise(resolve => setTimeout(resolve, backoffSeconds * 1000));

      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid access code"
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Success - reset attempts
    await supabase
      .from("site_gate_attempts")
      .delete()
      .eq("ip", clientIP);

    console.log(`✅ Valid access granted - IP: ${clientIP}, domain: ${domain}, rid: ${rid}`);

    // Create signed JWT session token (with proper claims structure)
    const signedToken = await signGateToken(
      clientIP, // Using IP as subject for now (could be user ID if authenticated)
      'admin', // Grant admin role for valid access codes
      SESSION_TTL_MS / 1000 // Convert ms to seconds
    );
    
    // Verify token to get expiry time
    const { verifyGateToken } = await import("../_shared/tokens.ts");
    const claims = await verifyGateToken(signedToken);
    const expiresAt = new Date(claims.exp * 1000).toISOString();

    // Set HttpOnly cookie
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append(
      "Set-Cookie",
      `clubhouz_gate=${signedToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_TTL_MS / 1000}`
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });

    console.log(JSON.stringify({
      rid,
      status: 200,
      code: 'ACCESS_GRANTED',
      expiresAt
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Access granted", 
        sessionToken: signedToken, 
        expiresAt 
      }),
      { status: 200, headers }
    );

  } catch (error: any) {
    console.error("Error in secure-site-access function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Internal server error" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);