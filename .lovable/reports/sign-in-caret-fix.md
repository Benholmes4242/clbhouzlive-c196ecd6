# Sign-in caret fix

## Diff and files
Only application-source change: `src/pages/auth/components/auth-hero.css:28`, delete `caret-color: var(--auth-amber);` from `.auth-hero-input`. The email field now uses the unchanged global white caret.

```diff
- color: var(--auth-ink); caret-color: var(--auth-amber); margin-bottom: 12px;
+ color: var(--auth-ink); margin-bottom: 12px;
```

`--auth-amber` remains used by `.auth-hero-dot` at line 8, so `src/index.css` is unchanged. No other application source changes. No test files, assertions, or case names changed; none deleted, renamed, rewritten or added. `roadmap.md` updated and this report added.

## Commands and totals
Focused (same files/options as stop report; output stored separately):
`bunx vitest run src/test/signInRedesign.test.tsx src/test/signinFix1.test.tsx src/test/guestSignIn.test.tsx src/test/guestBrowsing.test.tsx src/test/guestStage25.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-caret-fix/focused.json`

64 executed / 64 passed / 0 failed.

Separate shard commands:
- `bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-caret-fix/shard-3.json`
- `bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-caret-fix/shard-4.json`

| Shard | Executed | Passed | Failed | Evidence |
|---|---:|---:|---:|---|
| 1 | 2,203 | 2,203 | 0 | Prior passing run, reused as requested |
| 2 | 2,116 | 2,116 | 0 | Prior passing run, reused as requested |
| 3 | 2,196 | 2,196 | 0 | Fresh run |
| 4 | 2,229 | 2,229 | 0 | Fresh run |
| Total | 8,744 | 8,744 | 0 | Combined four-shard verification |

Expected inventory before/after this fix: 8,744 → 8,744, no delta. Last full pre-redesign baseline 8,731 + 13 previously added signInRedesign cases = 8,744; all 13 names already recorded in sign-in-redesign-stop.md. No further changes to reconcile.

## Scope and verification
The unchanged `ep51SearchAndCarets.test.tsx:32` assertion now passes in shard 3. `git diff --check` passes. Fresh preview signal: `=== build 2026-11-15T08:02:35Z ===` / `build OK`. No SQL, migrations, feed_config, authentication sends, or other layout changes. Previous 390/320 visual checks and real sign-in checks remain unverified; this request only corrects the caret and verifies the specified tests.
