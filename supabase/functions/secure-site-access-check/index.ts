import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

function makeCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Parse cookies from header
function parseCookie(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((pair) => pair.trim().split("=").map(decodeURIComponent))
  );
}

// Verify signed token
async function verifyToken(token: string, key: string): Promise<any | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    // Verify signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(`${headerB64}.${payloadB64}`);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode expected signature
    const expectedSig = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - signatureB64.length % 4) % 4)), 
      c => c.charCodeAt(0)
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const actualSig = new Uint8Array(signature);

    // Compare signatures
    if (actualSig.length !== expectedSig.length) return null;
    for (let i = 0; i < actualSig.length; i++) {
      if (actualSig[i] !== expectedSig[i]) return null;
    }

    // Decode payload
    const payloadJson = atob(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - payloadB64.length % 4) % 4)
    );
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch (e) {
    console.error("Token verification error:", e);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookies = parseCookie(cookieHeader);
    const token = cookies["clubhouz_gate"];

    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, message: "No session found" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const signingKey = Deno.env.get("SITE_ACCESS_SIGNING_KEY");
    if (!signingKey) {
      console.error("SITE_ACCESS_SIGNING_KEY not configured");
      return new Response(
        JSON.stringify({ ok: false, message: "Server misconfigured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const payload = await verifyToken(token, signingKey);

    if (!payload) {
      return new Response(
        JSON.stringify({ ok: false, message: "Invalid or expired session" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in secure-site-access-check:", error);
    return new Response(
      JSON.stringify({ ok: false, message: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
