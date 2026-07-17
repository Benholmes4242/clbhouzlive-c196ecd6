// Canonical CORS helper for every edge function in this project.
//
// Design contract (see CORS standardization brief):
//   - Known origins get a strict echo-back + Vary: Origin (cache-safe).
//   - Unknown origins FAIL OPEN with '*'. This is deliberate: the app
//     runs inside a Median.co WebView (iOS/Android) whose Origin header
//     is environment-specific and not fully enumerated. Hard-blocking
//     unknown origins would risk locking out mobile users. This is a
//     hardening/consistency pass, not a vuln fix - the token auth
//     (SUPABASE JWT / internal-secret headers) remains the real
//     authorization boundary.
//   - Allow-Headers is the SUPERSET of every header any function in the
//     repo has historically accepted, so no function loses a header
//     during the sweep.
//   - Methods are per-function overridable via corsFor(origin, methods).
//
// Back-compat exports:
//   - `corsHeaders` (wildcard, kept for the 19 pre-existing importers,
//     widened Allow-Headers only - no behavior break).
//   - `cors(origin)` aliased to `corsFor(origin)`.

const ALLOWED_ORIGINS = new Set<string>([
  "https://clbhouz.com",
  "https://www.clbhouz.com",
  "https://clbhouz.co.uk",
  "https://www.clbhouz.co.uk",
  "https://app.clbhouz.co.uk",
  "https://admin.clbhouz.co.uk",
  "https://courses.clbhouz.co.uk",
  "https://media.clbhouz.co.uk",
  "https://clbhouzlive.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  // Median WebView origin(s) - to be captured from canary logs and
  // added here. Fail-open default protects mobile until then.
]);

// Superset of every Allow-Headers value observed across the function
// tree (audited during the sweep). Widening this is safe; narrowing
// requires an audit.
const ALLOW_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "range",
  "x-supabase-api-version",
  "x-supabase-auth",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
  "x-internal-secret",
  "x-push-secret",
  "x-cleanup-secret",
  "x-cron-secret",
].join(", ");

const DEFAULT_METHODS = "GET, POST, OPTIONS";

/**
 * Build a CORS header set for a given request Origin.
 *
 * @param origin  The value of `req.headers.get("Origin")`. Null/undefined
 *                is treated as unknown -> fail-open '*'.
 * @param methods Optional override, e.g. "GET, HEAD, OPTIONS" or
 *                "POST, DELETE, OPTIONS". Defaults to "GET, POST, OPTIONS".
 */
export function corsFor(
  origin: string | null | undefined,
  methods: string = DEFAULT_METHODS,
): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

// ---- Back-compat aliases -------------------------------------------------

/**
 * Legacy wildcard header set. Kept so the 19 functions that already
 * import `corsHeaders` continue to work unchanged. Behavior is
 * strictly permissive (same as before this sweep) with a widened
 * Allow-Headers superset. Prefer `corsFor(origin)` in new code.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": DEFAULT_METHODS,
  "Access-Control-Allow-Headers": ALLOW_HEADERS,
  "Access-Control-Max-Age": "86400",
};

/** Alias for corsFor - kept for pre-existing `cors` importers. */
export const cors = corsFor;
