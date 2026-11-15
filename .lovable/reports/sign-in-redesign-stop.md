# Signed-off sign-in redesign — stopped

## Outcome
Implemented choose/email/web presentation and clarified safe-area spacing. Focused checks pass, but stopped after shard 3 on an unexpected existing assertion. Shard 4 and browser comparison were not run. The preview also reports a surviving new-test type error; no repair was attempted after the stop.

## Files
- `src/pages/auth/components/AuthHeroScreen.tsx`: choose/email state, preserved exported logos and sign-in callbacks, focused email, zod validation, canonical guest switch/session eligibility and state.from/root return. OTP unchanged.
- `src/pages/auth/components/auth-hero.css`: scoped signed-off layout, round social buttons, text-only or, pills, terms, band, small-phone rules and preserved/reduced-motion entrances. Local header owns step/OTP and safe-area decisions.
- `src/index.css`: semantic sign-in colors and glow tokens.
- `public/locales/en/auth.json`: five new keys; termsBlock retained unchanged.
- `src/test/signInRedesign.test.tsx`: 13 new interaction cases using a real translation provider and MemoryRouter.
- `roadmap.md`: task and stop accounting.
- `.lovable/reports/sign-in-redesign-stop.md`: this report.

## Assertion changes
No existing test assertion was changed. No test was deleted, renamed or rewritten. The 13 added cases are:
- signed-off sign-in interaction rules offers native social actions without an initial email field
- signed-off sign-in interaction rules focuses email when entering the email step
- signed-off sign-in interaction rules keeps typed email when returning through choose
- signed-off sign-in interaction rules enables submission only for a valid trimmed email
- signed-off sign-in interaction rules preserves Enter submission and validation
- signed-off sign-in interaction rules shows server errors in email then clears them after editing
- signed-off sign-in interaction rules returns browsing to the prior location
- signed-off sign-in interaction rules returns browsing to root without a prior location
- signed-off sign-in interaction rules suppresses browsing when the switch is off
- signed-off sign-in interaction rules suppresses browsing for a signed-in member
- signed-off sign-in interaction rules allows browsing for a canonical anonymous guest but not unresolved sessions
- signed-off sign-in interaction rules does not offer native social actions on web
- signed-off sign-in interaction rules disables every choose action while a method submits

## Commands and totals
Focused:
`bunx vitest run src/test/signInRedesign.test.tsx src/test/signinFix1.test.tsx src/test/guestSignIn.test.tsx src/test/guestBrowsing.test.tsx src/test/guestStage25.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-redesign/focused.json`
64 executed / 64 passed / 0 failed.

Each shard ran in its own command:
`bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-redesign/shard-N.json`

| Shard | Executed | Passed | Failed |
|---|---:|---:|---:|
| 1 | 2,203 | 2,203 | 0 |
| 2 | 2,116 | 2,116 | 0 |
| 3 | 2,196 | 2,195 | 1 |
| 4 | Not run | — | — |

Last full passing baseline: 8,731. Expected inventory after 13 added cases: 8,744; not a full-suite passing result. Executed shards total: 6,515 / 6,514 passed / 1 failed.

## Stop errors (verbatim)
Unchanged `src/test/ep51SearchAndCarets.test.tsx:32:23`, case `EP5.1 cursor sweep has a non-important global white default and no amber/primary caret in source`:
```
AssertionError: expected [ Array(1) ] to deeply equal []
    at /dev-server/src/test/ep51SearchAndCarets.test.tsx:32:23
```
Assertion: `expect(offenders).toEqual([]);`
Offender: `src/pages/auth/components/auth-hero.css`, whose requested amber caret is `caret-color: var(--auth-amber)`.
The new brief explicitly requests an amber email caret, while this existing sweep forbids amber carets throughout source. No assertion or source was changed to evade the sweep.

Preview typecheck:
```
src/test/signInRedesign.test.tsx(18,123): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'initImmediate' does not exist in type 'InitOptions<unknown>'.
```
This is the new real-provider test initialization option, not an application sign-in error. It remains uncorrected under the stop rule.

## Verification and frozen scope
No SQL, migrations, feed_config, guest minting, OTP changes, or real sign-in sends. Session-expired toast and errorNonce behavior retained. Branding/font drift notices concern unrelated files, which were not touched. Font stack remains inherited. User clarification implemented: max(34px, calc(14px + env(safe-area-inset-bottom, 0px))) for band/email/no-band bottoms; small-height band minimum 18px. 390/320 visual comparison and real social/code sign-in remain unverified. No completion or visual-parity claim.
