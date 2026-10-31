# Linked, no index yet — implemented states, verification stop

## Result and limits
Added linked independently of index-connected. Island no-index management, owner profile notice, empty owner Rounds invitation suppression, Scores invitation suppression and zero-round done states are implemented. No SQL, migrations, deployed functions/RPCs, feed_config, cap or native changes. No new negative letter-spacing.

Authenticated end-to-end checks unavailable (`external_unmanaged`); affected member's phone verification remains Ben's responsibility. No fabricated member session or screenshot substituted. The completion CTA and management destinations are unit-exercised, not a hosted member readback.

## State/consumer audit
- `useHandicapChipState`: linked = live connection reader result; that reader already filters deleted_at null. connected = linked plus non-null current trend, including valid index zero. Settlement/error behavior unchanged.
- `ChromeIsland.HcpCell`: !linked invites; linked without connected shows muted 16px/700 em dash over INDEX, no movement and opens `/manage/handicap`; connected retains IndexGlance and trend.
- `ProfileHero` owner: !linked gates example/connect; linked&&!connected gates provider notice irrespective of hideConnectPrompt. connected still gates all real index/chart/form blocks. Visitor comparison remains viewerChip.connected. Counter strip unchanged.
- `ScoresStandingSlot`: connected keeps StandingShelf; linked/no-index returns null; only !linked gets invitation.
- `ProfileRoundsTab.EmptyRoundsConnection`: new consumer mounted only for empty own histories, so populated/visitor history query ownership remains unchanged. Unsettled is blank; linked gets shared provider-management notice; not linked keeps existing invitation.
- `WhsHandicapTab` and `HandicapManagePage`: already use live connection presence, not index, for dashboard/manage versus connect; untouched.
- `SettingsHandicapCard`: already uses connection presence and a separate indexKnown condition; linked/no-index already shows Manage/dash; untouched.
- Additional invitation requiring follow-up: `features/edit-profile/completionRules.ts:10` declares handicap complete only when `p.handicap != null`, with “Connect your handicap”. This is not a useHandicapChipState consumer. Its editor state handoff was not changed before the surviving-error stop; the blanket “every invitation” audit therefore is not fully completed. Do not claim no remaining connect prompts across the entire app.

## Completion source correction
`useImportedCounts` previously converted a real rounds=0 result to null, making the screen wait until its ceiling instead of recognizing an empty record. Completion now opts into `{allowZero:true}` using an isolated including-zero cache key. Missing RPC row remains null. Existing ManageScreen/onboarding callers keep legacy null-on-zero behavior/cache keys. No server changes.

Done: confirmed zero/no index selects You're connected and no-index explanation, hides index/courses/shots/holes and retains CTA. Confirmed zero/with index selects Your index is here, retains the existing index and first-round sentence, hides round-detail blocks. Positive-round and pending behaviors retained. New keys added to handicap/profile in en, en-XA, de, es, ja, ko; existing copy untouched.

## Tests, commands and reconciliation
Baseline from the preceding Tour recheck: 4,868 passed/1 existing failure/4,869 total across490 files.
- `bunx vitest run src/test/linkedHandicapState.test.tsx src/test/linkedHandicapProfile.test.tsx src/test/linkedHandicapDone.test.tsx src/test/linkedImportedCounts.test.tsx src/test/islandsNav.test.tsx src/test/islandsRound2.test.tsx src/test/heroConnectExample.test.tsx src/test/heroConnectPanel.test.tsx src/test/profileRoundsVoice.test.tsx src/test/connectDoneChrome.test.tsx --maxWorkers=2`: **78/78 across10 files**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,389/2,389 across247**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,500 passed/1 failed/2,501 total across247**.
- Full: **4,889 passed/1 pre-existing failure/4,890 total across494**, zero unhandled errors. Delta +21/+4 from 4,869/490; no deleted, renamed or rewritten existing tests; no changed assertions.

Added tests by file/name:
- linkedHandicapState.test.tsx (9): no live connection is neither linked nor connected; a live connection with no index is linked but not connected; a readable index preserves connected including index zero; settlement still waits for the chained trend read; unlinked opens only ConnectGlance; linked without index navigates to management and never opens either glance; indexed connection retains IndexGlance without navigation; linked without index renders neither invitation nor unsupported standing figures; indexed connection retains the standings shelf.
- linkedHandicapProfile.test.tsx (6): replaces the example and connect panel with the provider management notice; preserves all three counter actions below the notice; never adds an owner connection notice on a visitor profile; unlinked owner retains the existing example; linked owner gets management rather than another connect prompt; unsettled empty state never flashes an invitation.
- linkedHandicapDone.test.tsx (4): zero rounds and no index hide every data block and retain completion CTA; zero rounds with an index keep only the index block; rounds present retain the index and landing-breakdown section; unresolved counts are not interpreted as a confirmed empty record.
- linkedImportedCounts.test.tsx (2): completion reads confirmed zero while legacy consumers still read null; no count row stays unresolved instead of becoming zero.

Existing test fixture-only updates, assertions retained:
- islandsNav.test.tsx (19 unchanged): connected fixture gains linked:true.
- heroConnectExample.test.tsx (16 unchanged): default/reset gains linked:false; connected cases set linked:true before connected:true.
- heroConnectPanel.test.tsx (5 unchanged): default/reset gains linked:false; two connected fixtures gain linked:true.
No translated-copy/style/snapshot tests added; tests assert source states, destinations, block presence and callback behavior.

## Surviving errors — STOP
Pre-existing test, unchanged: `src/test/be2BusinessPreview.test.tsx:76:263`, `BE2 immediate editing > makes Name read-only for club`: `TestingLibraryElementError: Found multiple elements with the text: /from your club/`.

Pre-existing automatic type errors, unchanged at completed-edit check (`2026-10-31T11:09:47Z`):
```
src/pages/BusinessProfileEditor.tsx(573,20): error TS2367: This comparison appears to be unintentional because the types '"about" | "cover" | "established" | "hours" | "logo"' and '"website"' have no overlap.
src/pages/BusinessProfileEditor.tsx(574,9): error TS2367: This comparison appears to be unintentional because the types '"about" | "cover" | "established" | "hours" | "logo"' and '"phone"' have no overlap.
```
No new test failure; unrelated test/source was not changed to force green. Preview is not typecheck-clean. Full-suite all-pass request cannot be satisfied in this state. No manual build/typecheck run.

## Changed files
Production: src/lib/whs/useHandicapChipState.ts; src/features/chrome-v2/ChromeIsland.tsx; src/components/profile/hero/ProfileHero.tsx; new src/components/profile/hero/LinkedHandicapNotice.tsx; src/components/profile/rounds/ProfileRoundsTab.tsx; src/features/explore-magazine/ConnectStandingInvite.tsx; src/components/profile/handicap/whs/connect/WelcomeAboardScreen.tsx; src/components/profile/handicap/whs/connect/useImportedCounts.ts.

Locales: public/locales/{en,en-XA,de,es,ja,ko}/{handicap,profile}.json (12).

Tests: four new linked*.test.tsx files named above; three existing fixture files named above. Documentation: AGENTS.md, roadmap.md, this report; preference memory linked-no-index.md/index. AGENTS budget prevented adding a new line; its Settings/export ownership pointer was replaced with a module-header pointer and CSV ownership retained in the module header, not removed.