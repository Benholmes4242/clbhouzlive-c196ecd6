# Migrate to Supabase signing keys (asymmetric JWTs)

Tonight's `verify_jwt = false` change restored service by moving authentication from the gateway into the functions. This is the real fix: move the project off the legacy HS256 shared secret onto asymmetric signing keys, then put the gateway check back.

Do this in daylight, not during an incident.

## Why

The Functions gateway no longer accepts legacy HS256 tokens — platform policy, not a project setting. Legacy keys still work on `/rest/v1` and `/auth/v1`, so the app itself is unaffected today. That asymmetry will not last forever, and four functions are currently down because they cannot self-validate.

## What it touches

**Auth configuration (dashboard).** Create an asymmetric signing key (ES256/RS256), promote it to current, keep the legacy secret in standby. Supabase publishes a JWKS endpoint at that point.

**Token format.** New access tokens are signed with the new key and carry a `kid` header. Verification moves from a shared secret to public-key lookup against JWKS.

**All 27 functions.** Once tokens are asymmetric the gateway accepts them, so `verify_jwt = true` goes back on every function that had it — the 8 verification/claim functions and the 14 flipped tonight.

**The four still-gated functions.** These have no caller check at all and must not be exposed. Each needs a real guard before it can come back:
- `lookup-user-by-email` — email-to-user-id oracle; needs an authenticated caller plus an admin/role check.
- `generate-season-wrap` — takes `seasonId` and `userId` from the body; needs the caller to match `userId` or be an admin.
- `compute-golfer-eligibility-signals` — batch job; should move to a cron/internal-secret guard rather than a user JWT.
- `send-business-invite` — sends mail on any `inviteId`; needs the caller to be a member of the inviting business.

**In-code validation.** Prefer `getClaims(token)` over `getUser(jwt)` where a round-trip isn't needed: `getClaims` verifies against JWKS locally, so it keeps working under both key formats and removes a network hop per request. `getUser` continues to work — it validates server-side — so this is an improvement, not a prerequisite.

**Anything holding a hardcoded token.** Cron jobs carrying the anon key inline need review. They call REST, which still accepts legacy keys, but they should move to the publishable key format in the same pass.

## What breaks mid-flight

Nothing, if the legacy secret stays in standby. Supabase verifies against both current and standby keys during the overlap, so tokens minted before the switch stay valid until they expire (1 hour) and refresh cleanly into the new format.

The failure mode is removing the legacy key too early: any session still holding an HS256 access token gets rejected on REST, and every user is signed out at once. The legacy key stays in standby until traffic shows no legacy tokens in use — a week is comfortable, given a 1-hour access token and a 30-day refresh window.

## Do existing sessions survive

Yes. Refresh tokens are opaque database rows, not JWTs — they are unaffected by a signing-key change. Each client swaps its access token for a new-format one on the next refresh, silently, with no re-login. Native app sessions behave the same way.

## Rollback

Demote the new key and promote the legacy secret back to current. Both keys are verifiable throughout the overlap, so rollback is a single dashboard action with no code change and no forced sign-out. It restores tonight's state exactly: REST works, the Functions gateway refuses HS256, and the functions keep self-validating.

The one-way door is *deleting* the legacy key. Do not do that in the same session as the promotion.

## Sequence

1. Create the asymmetric key; leave legacy in standby.
2. Promote the new key to current. Verify a fresh login and a token refresh in the app.
3. Probe two functions with a real member token — confirm the gateway passes an asymmetric token through.
4. Restore `verify_jwt = true` on the 22 self-validating functions; redeploy; re-probe.
5. Add caller checks to the four gated functions, then bring them back behind `verify_jwt = true`.
6. Move `getUser` to `getClaims` where the extra round-trip isn't wanted.
7. After a week with no legacy tokens observed, retire the legacy secret.

Steps 1-4 are one sitting. Step 5 is independent and can be scheduled separately per function.
