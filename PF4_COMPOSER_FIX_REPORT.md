# PF4_COMPOSER_FIX — stopped at verification

## Implemented
- Edit sheet: close-only top-left control, removed grabber/title/DONE,112×140 filmstrip with5px outline clearance and bottom order controls.
- On the course: course selection only; no post-wide hole/tag/guide controls or writes.
- Individual uploads carry post_media.hole_no in all four image/video local/remote branches. Composer no longer calls hole-library insert helpers. Existing shot edits remove legacy non-source-linked URL tags before updating their hole, preserving studio edits.
- Place contributions require personal+Everyone; shot choices remain in existing studio_edits for other audiences and draft restoration. No new columns or server work.
- Inline Played with reuses existing member search and rank suggestions, adds username/home club, excludes self, clears after selection, removable chips and eight-person limit.
- Audience explanation opens visibility; footer counts eligible hole shots only. Draft summary is Course and tags with nonzero tagged-shot count.
- Preview uses the existing FeedCard three-line caption/more mechanism; local holes now use the PF1B chip. Feed/fullscreen resolve media_holes by identity then order; legacy hole stays on first slide. Profile feed receives shared batched context but deliberately retains its existing round-row behavior.

## Test counts and commands
Last reported baseline:7,702 tests. Added26 cases in src/test/pf4ComposerRules.test.tsx; no deleted cases/files. Existing case rewrites retain counts. Expected and executed full scope:7,728 tests across675 files.

Focused command:
`bunx vitest run src/test/pf4ComposerRules.test.tsx src/test/pf1ComposerGolf.test.tsx src/test/pf1bPostGolfContext.test.tsx src/test/pf2HoleGuide.test.tsx src/test/pf1Drafts.test.ts src/test/postPageGolf.test.tsx src/test/pf1bFeedCard.test.tsx src/test/feedPhotoGridCard.test.tsx src/test/viewPost1Composer.test.tsx --maxWorkers=2`

124/124 passed. This run preceded the final remote-retention/profile-feed wiring; full shards below ran after those edits.

Each shard was its own command:
- `bunx vitest run --maxWorkers=2 --shard=1/4`:1,994passed/169files.
- `bunx vitest run --maxWorkers=2 --shard=2/4`:1,858passed/169files.
- `bunx vitest run --maxWorkers=2 --shard=3/4`:1,977passed/169files.
- `bunx vitest run --maxWorkers=2 --shard=4/4`:1,893passed+6failed/168files.

Total7,722passed+6failed=7,728executed. Known pre-existing tourIsland.test.tsx:235 did not fail. No other failures treated as known.

## Unexpected failure — stopped, not repaired
`src/test/profileFeedInViewGate.test.tsx`, all six cases:
1. plays nothing while the hero covers the screen and no card is visible
2. plays nothing while the first card only peeks in below the hero
3. plays the first card once it is properly on screen
4. stops and releases audio once the member scrolls back up to the hero
5. keeps playing through the hysteresis band and resumes when back in view
6. still promotes the centred card while scrolling through the feed

Tool output:
```text
Error: No QueryClient set, use QueryClientProvider to set one
❯ useQueryClient node_modules/@tanstack/react-query/src/QueryClientProvider.tsx:18:11
❯ Module.usePostGolfContext src/hooks/feed/usePostGolfContext.ts:83:20
❯ LightCardFeed src/components/posts-tab/LightCardFeed.tsx:162:26
```
The new profile-feed batched context read requires the query provider absent from this isolated test setup. No failing test or production repair was attempted after this failure. Exact output is retained in docs/verification/pf4/shard4.log; other logs alongside it.

## Authorized existing test rewrites (no count delta)
Complete before/after assertions are preserved in docs/verification/pf4/authorized-test-changes.diff.
- pf1ComposerGolf.test.tsx, “attaching writes attached_score_id and never round-post whs_score_id”: old `toEqual({tagged_course_ids:['c'],hole_no:15,shot_tags:['view'],attached_score_id:'score'})`; new retains only tagged_course_ids/attached_score_id. PF4 stops post-wide writes.
- Same file, “mounted hole controls set then clear the selection” renamed “selected course no longer exposes post-wide hole controls”: old aria-pressed true then false; new `queryByRole('button',{name:'Hole 15'})` is null. PF4 removes these controls.
- pf1Drafts.test.ts, “reopens course, hole, tags, round, visibility and ordered media” renamed “reopens course, round, visibility and ordered media without legacy post-wide tags”: old `holeNo:15,postShotTags:['view']`; new `holeNo:null,postShotTags:[]`. Course/round/order/visibility assertions retained.
- pf1bPostGolfContext.test.tsx, “writes add_to_hole_guide with the hole when the toggle is on” renamed “ignores the legacy guide-on fields”: old `{tagged_course_ids:['c1'],hole_no:15,add_to_hole_guide:true}`; new `{tagged_course_ids:['c1']}`. PF4 withdraws these writes.
- Same file, “writes the effective boolean both ways, but never without a hole or a course” renamed “ignores legacy guide-off fields while retaining course association”: old false hole/guide fields removed from expected patch; no-course/no-hole assertions retained.
- Same file, “includes add_to_hole_guide in the posts patch when the guide toggle is on” renamed “submission writes course association without legacy hole-guide fields”: old `toMatchObject({hole_no:15,add_to_hole_guide:true,tagged_course_ids:['c1']})`; new exact `toEqual({tagged_course_ids:['c1']})`.
- pf2HoleGuide.test.tsx, “golfPostPatch writes the effective boolean false when a hole is set” renamed “golfPostPatch no longer writes either legacy guide boolean”: both old patches included hole_no and add_to_hole_guide; both new patches contain only tagged_course_ids. Preserved legacy helper/UI tests untouched.
- postPageGolf.test.tsx, “a hole-tagged photo goes through the Media tab library write once its url exists” renamed “a hole-tagged photo makes no client library write”: old `holePhoto.toHaveBeenCalledWith(file,url,'c1','me',7,[7])`; new both holePhoto/holeVideo not called. PF4 makes server publication authoritative.

## Requested checks
1. Four-shot Everyone publication into two hole pages with View post: not run; Ben/device and database confirmation remain. No SQL performed.
2. Followers publication absent from hole pages: client gating/visibility interaction covered; hosted publication/readback unverified.
3. Edit cross/no DONE and ring at both strip ends: implemented, real getBoundingClientRect/320px verification not run after stop.
4. Type Tho/add Thomas/chip: mounted inline interaction passed; real composer preview “with Thomas” not checked on device.
5. Feed slide2/3 own holes: resolver/fullscreen tests passed; actual feed interaction/browser check not run.

320px mocksB–D/Edit, caption overflow/more, ring bounds, and authenticated end-to-end remain unverified. Auth status is external_unmanaged, so no managed authenticated browser checks are available. No credentials requested.

Latest preview signal: buildOK at2026-11-08T10:43:54Z. No SQL/migrations/deployed RPC/edge/native/Median/feed_config/cap changes. Protected guest/review/news/round-plot surfaces untouched. Do not treat this as a completed or device-verified release.