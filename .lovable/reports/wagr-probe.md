# WAGR feasibility probe — validation stop

## File
`supabase/functions/probe-wagr-profile/index.ts`

Read-only implementation with the existing rankings service-role/signed-in-admin auth branch; `is_admin` is the only RPC and is used exclusively for the required auth check. No application data reads or writes, SQL, migrations, scheduling, client changes or new secrets. The internal scheduling-secret branch is intentionally not supported, matching the brief's service-role/admin-only caller requirement. Module-level response helpers use module-level SDK `corsHeaders`.

## Deploy result
Not deployed. Validation encountered a type-check error; work stopped under the project's stop rule. No other functions were deployed.

## Invocation and full response
Not invoked. No invocation auth was used, and no WAGR JSON response exists to paste. The environment reports `external_unmanaged`; no managed browser session is available. Ben will need to invoke after the validation issue is resolved and the function is deployed.

## Exact validation failure
Command: `deno test --allow-env --allow-net supabase/functions/probe-wagr-profile/index_test.ts`

```text
Check supabase/functions/probe-wagr-profile/index_test.ts
TS2307 [ERROR]: Cannot find module 'npm:@supabase/supabase-js@2/cors'.
    at file:///dev-server/supabase/functions/probe-wagr-profile/index.ts:7:29

error: Type checking failed.

  info: The program failed type-checking, but it still might work correctly.
  hint: Re-run with --no-check to skip type-checking.
```

No type-check bypass was used. No tests executed; this is a validation/import failure, not a failed assertion.

## Tests and counts
Previous application-suite baseline: 8,593 passed. Application test files unchanged; full application suite not rerun for this isolated probe. Three new Deno tests were added, but none ran because module checking failed:
- `WAGR slug accepts lewy-hayward-41967 and rejects unsafe paths`
- `WAGR requests preserve order, 1000ms spacing, honest headers and full JSON`
- `WAGR block pages and network failures never stop later requests`

No tests deleted, renamed or rewritten. Application-suite count remains 8,593; three separate, unverified edge-function cases added.