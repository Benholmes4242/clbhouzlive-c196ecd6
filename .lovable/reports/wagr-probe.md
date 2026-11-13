# WAGR feasibility probe — deployed; invocation unauthorized

## File
`supabase/functions/probe-wagr-profile/index.ts`

Read-only implementation with the existing rankings service-role/signed-in-admin auth branch; `is_admin` is the only RPC and is used exclusively for the required auth check. No application data reads or writes, SQL, migrations, scheduling, client changes or new secrets. The internal scheduling-secret branch is intentionally not supported, matching the brief's service-role/admin-only caller requirement. Module-level response helpers now use module-level `corsHeaders` initialized with the house `corsFor(null)` helper; the Deno.serve callback assigns the request-origin headers before calling the unchanged handler. No other function code changed; the five protected functions were untouched.

## Deploy result
Tool result: `Successfully deployed edge functions: probe-wagr-profile`

Submitted source SHA-256: `995e8409d3ae374012c261ce0d7d0ae82e0846a24fe053ed98a571dbd417406e`.

Only `probe-wagr-profile` was deployed. The invocation below reached its authorization check.

## Invocation and full response
Exactly one invocation was attempted with `POST /probe-wagr-profile`, `Content-Type: application/json`, and body `{"slug":"lewy-hayward-41967"}` through `supabase.curl_edge_functions`.

Auth used: no explicit Authorization header or service-role credential was supplied. The tool's automatic preview-auth mechanism did not provide usable authentication: the function returned HTTP 401 `Unauthorized` (the handler's missing-Bearer-token response).

Complete, unedited JSON response:

```json
{"error":"Unauthorized"}
```

Stopped after this single attempt. No WAGR requests ran, so no profile/events/graph response exists. Ben must invoke the deployed function with service-role or signed-in-admin authorization; no retry was made.

## Previous validation failure (resolved)
Command: `deno test --allow-env --allow-net supabase/functions/probe-wagr-profile/index_test.ts`

```text
Check supabase/functions/probe-wagr-profile/index_test.ts
TS2307 [ERROR]: Cannot find module 'npm:@supabase/supabase-js@2/cors'.
    at file:///dev-server/supabase/functions/probe-wagr-profile/index.ts:7:29

error: Type checking failed.

  info: The program failed type-checking, but it still might work correctly.
  hint: Re-run with --no-check to skip type-checking.
```

The house CORS import resolved this error. No type-check bypass was used.

## Tests and counts
Command rerun: `deno test --allow-env --allow-net supabase/functions/probe-wagr-profile/index_test.ts`.

Result: **3 passed, 0 failed**. Previous application-suite baseline: 8,593 passed; application test files unchanged and full application suite not rerun for this isolated import correction. Separate Deno test inventory before/after: 3/3, unchanged:
- `WAGR slug accepts lewy-hayward-41967 and rejects unsafe paths`
- `WAGR requests preserve order, 1000ms spacing, honest headers and full JSON`
- `WAGR block pages and network failures never stop later requests`

No tests deleted, renamed or rewritten. Application-suite inventory remains 8,593; the three separate edge-function cases are now verified.