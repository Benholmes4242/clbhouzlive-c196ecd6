// Cloudflare Pages Middleware – gate enforcement
export const onRequest: PagesFunction<{
  SITE_ACCESS_SIGNING_KEY: string
}> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const { SITE_ACCESS_SIGNING_KEY } = ctx.env;

  // --- Allowlist: public endpoints & assets ---
  const allow = [
    "/gate",               // your access page route
    "/robots.txt",
    "/favicon.ico",
    "/manifest.webmanifest",
  ];
  const isAllowed =
    allow.includes(url.pathname) ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/functions/"); // Supabase Edge Functions passthrough

  if (isAllowed) {
    return ctx.next();
  }

  // --- Check cookie ---
  const cookie = ctx.request.headers.get("Cookie") ?? "";
  const token = Object.fromEntries(
    cookie.split(";")
      .map(p => p.trim().split("=").map(decodeURIComponent))
      .filter(p => p.length === 2)
  )["clubhouz_gate"];

  if (!token || !SITE_ACCESS_SIGNING_KEY) {
    return Response.redirect(new URL("/gate", url), 302);
  }

  // --- Verify signed token ---
  const ok = await verifyToken(token, SITE_ACCESS_SIGNING_KEY);
  if (!ok) {
    // clear any bad cookie
    const headers = new Headers();
    headers.append("Set-Cookie", "clubhouz_gate=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
    headers.append("Location", "/gate");
    return new Response(null, { status: 302, headers });
  }

  // Good to go
  return ctx.next();
};

// ---- helpers ----
function b64urlToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const s = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function verifyToken(token: string, key: string) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return false;

    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(`${h}.${p}`));
    const sig = new Uint8Array(sigBuf);

    const sigExpected = b64urlToBytes(s);
    if (sig.length !== sigExpected.length) return false;
    // constant-time compare
    let ok = 0;
    for (let i = 0; i < sig.length; i++) ok |= sig[i] ^ sigExpected[i];
    if (ok !== 0) return false;

    const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
