# BUSINESS_POSTS_ALWAYS_EVERYONE — completed edits, verification stopped

2026-11-18. No SQL, migration, feed_config, maintenance flag, round_pool_cap, RPC or submit/update hook signature changes.

## Audience ownership and write paths
`useComposerVisibility.ts` owns business coercion and resets the choice to `anyone` across business/personal switches. StageComposer consumes that value everywhere it already passed visibility. Edit mode uses the stored post actor type rather than the global actor for audience authority; this protects editing a business post while personally signed in.

`StageComposer.tsx` line references:
- 201–202: effective actor and audience hook; 205 closes a business audience sheet.
- 226: edit-mode stored visibility goes through the audience setter; original value retained for personal diffing.
- 301 and 982: deep-link and sheet draft restoration normalise by the draft's stored actor before setting visibility.
- 612: new-shot upload tagging job gets the normalised visibility; covers create and edit-added media.
- 624 / 630: scheduledAt and audience share the existing create submit path; both immediate and scheduled business posts pass `anyone`.
- 674: business update always includes visibility `anyone`, even if the original value is already public; personal update retains its original change-only patch.
- 761: existing shot retag write receives the same normalised visibility.
- 852: draft save receives normalised visibility.
- 963: VisibilitySheet renders only for personal posting.
- 1195: Who can see this meta row renders only for personal posting.
- 1254: strip receives normalised audience/personal flag and has no visibility callback for business.

`ComposerGolf.tsx:24–25`: optional `personal` prop defaults true; business hole guides render nothing. No active production caller of ComposerHoleGuide was found; current strip is authoritative. `GolfPostSections.tsx` did not need an edit: holeLine already returns the business member-only explanation before testing audience, never a business visibilityAction. Added explicit stale-business-value regression.

## Tests and counts
No existing tests deleted, renamed, rewritten or assertion-modified. Added **6** cases in `src/test/businessPostsAlwaysEveryone.test.tsx`:
- business hole shots never offer an audience action even with a stale followers value
- business create, scheduled and shot payload audience is always anyone
- personal followers choice resets on business switch and stays anyone on switching back
- old business edit followers value loads as anyone and remains anyone for saving
- business draft restoration normalises a private stored choice
- personal retains all three choices unchanged

These are hook/pure-rule tests, not end-to-end create/update payload verification.

Focused command: `npx vitest run src/test/businessPostsAlwaysEveryone.test.tsx src/test/pf4ComposerRules.test.tsx src/test/pf2HoleGuide.test.tsx src/test/pf3aVideoComposerMounted.test.tsx --maxWorkers=2`: **46 passed** before the sixth business test was added. Final business-only command `npx vitest run src/test/businessPostsAlwaysEveryone.test.tsx --maxWorkers=2`: **6 passed**.

Sequential full-suite command: `npx vitest run --maxWorkers=2 --shard=N/4`, with stop-on-nonzero exit, logs `/tmp/business-audience-shards/`.
- Shard 1: **2,290 passed**, 202 passing files; **1 unhandled error**, exit 1.
- Shards 2, 3, 4: **not run**, automatic stop honoured.
- Full total **unmeasured**. Last reported full scope **9,142** → stopped feed inventory **9,150** (+8 in useSuggestedFeed.paging.test.tsx) → expected current inventory **9,156** (+6 here). Counts are expected until all shards run; no claim of a passing full suite.

Exact STOP error:
```text
Unhandled Rejection
TypeError: supabase.from is not a function
❯ Module.fetchCircleIds src/lib/social/circle.ts:44:6
❯ queryFn src/components/courses/browse/useFeaturedSignals.ts:40:7
```
Vitest: `This error originated in "src/test/proVerification2B.test.tsx" test file.` Latest test: `course members: verified-only labels with one batched screen read`. These files are untouched by this request. No rerun, mock repair or assertion change after the error.

Typecheck: `npx tsgo -b --noEmit` passed after completed app edits (before the final extra pure-rule test). Preview latest `build OK`: 2026-11-18T07:31:34Z.

## Brief observations and unavailable checks
- The brief's statement that business public visibility is enforced by hosted rules is accepted as Ben's ruling, not independently verified (no SQL).
- The existing edit actor is not automatically restored through useComposerActor; audience now uses editable.data.actorType so this cannot leak personal visibility into a business save. No unrelated actor routing changes made.
- No other brief contradiction found.
- Signed-in business create/edit/schedule/draft UI and network checks unavailable with external unmanaged Supabase. No signed-out/demo check is represented as end-to-end verification.
- Earlier feed paging stop remains unresolved; no further waits were authorised by this upload, and its tests were not edited.