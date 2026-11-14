# WAGR Settings — completed-edit typecheck stop

Implemented files:
- src/components/settings/SettingsTabContent.tsx
- src/features/amateur-ranking/SettingsWagrCard.tsx
- src/features/amateur-ranking/WagrLinkSheet.tsx
- src/features/amateur-ranking/wagrSettingsRules.ts
- src/features/amateur-ranking/wagr-settings.css
- src/features/pro-verification/SettingsTourResultsCard.tsx
- src/features/pro-verification/useShowTourResults.ts
- src/features/admin/hooks/useVerifications.ts
- src/test/wagrSettings.test.tsx
- src/test/wagrAdmin.test.tsx

No SQL, migrations, policies, feed_config or edge-function deployments/invocations.

## Stop signal
Latest preview typecheck at 2026-11-14T09:18:36Z:
```text
src/test/wagrSettings.test.tsx(35,50): error TS2353: Object literal may only specify known properties, and 'pending' does not exist in type '{ unknown: boolean; verified: boolean; kind: string; }'.
src/test/wagrSettings.test.tsx(35,66): error TS2353: Object literal may only specify known properties, and 'kind' does not exist in type '{ unknown: boolean; verified: boolean; pending: boolean; }'.
src/test/wagrSettings.test.tsx(65,106): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```
These are new test-side TypeScript errors, not failing runtime assertions. Stopped under completed-edit stop rule; no changes made to make them pass.

## Tests
Command: `bunx vitest run src/test/wagrSettings.test.tsx src/test/wagrAdmin.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-settings-focused.json`.
40 executed / 40 passed / 0 failed. All four full app shards unrun after typecheck stop. Last fully passing baseline 8,605; current inventory 8,640 (+33 WAGR Settings cases and +2 WAGR admin notification cases). Current full suite is unverified.

Changed existing cases (brief requires notification order and rejection notification):
- wagrAdmin.test.tsx “WAGR approval calls review RPC before invoking targeted sync”: old `expect(h.calls).toEqual(['rpc', 'sync'])`; new `expect(h.calls).toEqual(['rpc', 'notification', 'sync'])`, plus exact moderation recipient/admin/title/message assertion. Why: notification must occur after review and before sync.
- wagrAdmin.test.tsx “WAGR rejection records the note and never invokes sync”: old RPC assertion `expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: false, p_note: 'Different person' })` retained; added rejection notification title/message assertion. Why: sheet's promised notification now applies to rejected claims too.
No existing cases deleted or renamed.

## Screenshots
Requested five 390px and two 320px screenshots not captured before stop. Real signed-in checks unavailable on external_unmanaged Supabase; mocked browser visuals were planned, not executed and are not claimed.

## Focused cases
- src/test/wagrAdmin.test.tsx — WAGR pending claims have their own count and do not inflate pro/golfer counts — passed
- src/test/wagrAdmin.test.tsx — WAGR approval calls review RPC before invoking targeted sync — passed
- src/test/wagrAdmin.test.tsx — WAGR rejection records the note and never invokes sync — passed
- src/test/wagrAdmin.test.tsx — WAGR failed approval RPC never invokes sync — passed
- src/test/wagrAdmin.test.tsx — WAGR failed queue read is not treated as no claims — passed
- src/test/wagrAdmin.test.tsx — WAGR notification failure warns without failing the review or skipping sync — passed
- src/test/wagrAdmin.test.tsx — WAGR approval notifies even when the following sync fails — passed
- src/test/wagrSettings.test.tsx — WAGR card visibility for amateur — passed
- src/test/wagrSettings.test.tsx — WAGR card visibility for pending pro — passed
- src/test/wagrSettings.test.tsx — WAGR card visibility for verified tour pro — passed
- src/test/wagrSettings.test.tsx — WAGR card visibility for verified teaching pro — passed
- src/test/wagrSettings.test.tsx — WAGR card visibility for unresolved pro — passed
- src/test/wagrSettings.test.tsx — WAGR absent link offers linking — passed
- src/test/wagrSettings.test.tsx — WAGR rejected link offers linking — passed
- src/test/wagrSettings.test.tsx — WAGR pending link shows fetched rank and cancel deletes only member row — passed
- src/test/wagrSettings.test.tsx — WAGR pending failed lookup preserves name without a rank — passed
- src/test/wagrSettings.test.tsx — WAGR verified figures retain plain rank, ordinal best and events — passed
- src/test/wagrSettings.test.tsx — WAGR unknown figures display dashes rather than invented values — passed
- src/test/wagrSettings.test.tsx — WAGR unlink requires confirmation and deletes only member row — passed
- src/test/wagrSettings.test.tsx — WAGR updated branch first update on its way — passed
- src/test/wagrSettings.test.tsx — WAGR updated branch updated today — passed
- src/test/wagrSettings.test.tsx — WAGR updated branch updated Monday — passed
- src/test/wagrSettings.test.tsx — WAGR updated branch updated 1 Nov — passed
- src/test/wagrSettings.test.tsx — WAGR Best ordinals handle 11th, 12th, 13th and 21st — passed
- src/test/wagrSettings.test.tsx — WAGR sheet debounces 600ms and disables Send until current amateur lookup succeeds — passed
- src/test/wagrSettings.test.tsx — WAGR sheet successful request invalidates owner claim and closes — passed
- src/test/wagrSettings.test.tsx — WAGR sheet lookup error not_a_wagr_link — passed
- src/test/wagrSettings.test.tsx — WAGR sheet lookup error wagr_profile_is_pro — passed
- src/test/wagrSettings.test.tsx — WAGR sheet lookup error unknown — passed
- src/test/wagrSettings.test.tsx — WAGR sheet professional lookup refuses Send — passed
- src/test/wagrSettings.test.tsx — WAGR sheet request 409 already_linked — passed
- src/test/wagrSettings.test.tsx — WAGR sheet request 409 claimed_by_another — passed
- src/test/wagrSettings.test.tsx — WAGR sheet request 409 caller_is_pro — passed
- src/test/wagrSettings.test.tsx — WAGR sheet request 409 wagr_profile_is_pro — passed
- src/test/wagrSettings.test.tsx — WAGR visibility updates optimistically, disables saving and refreshes result caches — passed
- src/test/wagrSettings.test.tsx — WAGR visibility rolls back write error — passed
- src/test/wagrSettings.test.tsx — WAGR visibility rolls back read-back mismatch — passed
- src/test/wagrSettings.test.tsx — WAGR visibility treats null as enabled — passed
- src/test/wagrSettings.test.tsx — Tour results card omits update wording when no official rank exists — passed
- src/test/wagrSettings.test.tsx — Tour results card reuses official ranking date update wording — passed
