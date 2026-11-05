# OWGR cron authentication — deployed

`sync-pro-world-rankings` redeployed successfully; final submitted SHA-256 `430493cceff1bd37002df1965806932f1bd2bc582f237689d3439b029922e932`.

Internal-header presence is authoritative. `requireInternalSecret` now compares fixed-size SHA-256 digests using Node/Deno `timingSafeEqual`, shared rather than duplicated. Correct secret permits the all-pros run, refuses user_id with400; wrong/empty secret401 and unset500, with no JWT fallback. No-header admin and service-role paths retain existing validation. Ben owns scheduling; no SQL, migrations, schedule creation or live all-pros execution performed.

Files: shared internalAuth.ts, sync requestAuth.ts, sync index.ts, new owgrCronAuth.test.ts, roadmap and this report. Only sync-pro-world-rankings was redeployed; other functions were not deployed. The shared gate's signature/status/body semantics are unchanged, only comparison upgraded. Local ownership rules are in module headers.

## Tests
Before:7,094 tests/627 files. After:7,101/628, exactly seven new cases in owgrCronAuth.test.ts. No existing tests, assertions, mocks or fixtures changed; no tests renamed/deleted.
Cases: correct secret/no body runs all pros; correct secret/user_id400; wrong secret401 despite admin JWT; unset500; no-header admin unchanged; no-header service unchanged; empty header refuses fallback.

Focused: `bunx vitest run src/test/owgrCronAuth.test.ts src/test/owgrParse.test.ts src/test/owgrEventImportRules.test.ts --maxWorkers=2` —35/35 passed, three files. Rerun after type-only Deno declaration also35/35; initial and final logs retained.

Full suite: `bunx vitest run --maxWorkers=2 --shard=n/4`, n1–4:

| Shard | Passed | Known failed | Executed | Files |
|---|---:|---:|---:|---:|
|1|1,866|0|1,866|157|
|2|1,670|0|1,670|157|
|3|1,802|3|1,805|157|
|4|1,760|0|1,760|157|
|Total|7,098|3|7,101|628|

Only authorized known failures, untouched:
- src/test/fsNotch1.test.tsx:37:45: `AssertionError: expected '' to be '0px' // Object.is equality`.
- src/lib/media/__tests__/fullscreenBand.test.ts:65:18: `AssertionError: expected { top: +0, …(4) } to match object { top: +0, …(3) }`; width251.33333333333334 expected,251.33333333333331 received.
- src/lib/media/__tests__/fullscreenBand.test.ts:75:22: `AssertionError: expected 98.83333333333331 to be +0 // Object.is equality`.

Zero unexpected failures. Full output preserved at docs/verification/owgr-cron-auth/shard1.log–shard4.log. Shard1 preceded a type-only `declare const Deno` correction; focused suite reran after it, shards2–4 used final source. No executable behavior changed in that correction. Preview build error `internalAuth.ts(19,20): error TS2304: Cannot find name 'Deno'` resolved; build OK22:57:38Z. No manual build/typecheck.

Hosted cron execution/persistence is unverified and deliberately not triggered; Ben will add the weekly schedule. No secret values read or exposed.