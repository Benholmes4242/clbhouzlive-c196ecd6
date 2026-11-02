# CR2 — Creator profile verification report

## Result and outstanding gates
Implemented page-owned get_profile_creator read, optional prop forwarding through ProfileHero to ProfileCoverBand, Creator pill for every qualifying personal member, first/default Videos tab, accepted videos deep links, pending-content skeleton, non-creator replacement to Posts, three counted chips, 30-row cursor paging, shared Watch fullscreen playback, and round date-line video pills with isolated taps. Existing profile content and rounds ordering remain unchanged. RPC named columns are locally adapted to HubRpcRow before toFeedPosts, preserving captions, owner identity and creation dates.

All creator RPC calls use supabase.rpc, gated to signed-in non-anonymous profile visitors at the page boundary; Videos and round collector also require a viewer id. Round collector mounts only for a creator and receives already loaded round ids/dates. Its server ordering is retained, never re-created by client date heuristics.

## Test counts and exact commands
Previous reported inventory after CR1: **5,920 tests / 544 files** (not green). Last green baseline before CR1: **5,911 / 543**.
CR2 adds eight named cases in one new file, src/test/cr2CreatorProfile.test.tsx. No existing tests changed, deleted, or renamed. Current full-scope execution: **5,928 tests / 545 files**, **5,926 passing**, **2 pre-existing failures**, **0 unhandled errors**.
Reconciliation from last green: CR1 +8 creator-choice tests +1 business no-Creator-tile test / +1 file; CR2 +8 creator-profile tests / +1 file.

Focused command:
`bunx vitest run src/test/cr2CreatorProfile.test.tsx src/test/profileHeroClubWhite.test.tsx src/test/profileRoundsVoice.test.tsx --maxWorkers=2`
Result **11/11**, three files. Full output `/tmp/cr2-focused.log`.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, N=1,2,3,4. All four started together; all executed in full:

| Shard | Files | Passing tests | Failing tests | Exit |
|---|---:|---:|---:|---:|
|1|137|1,489|0|0|
|2|137|1,455|0|0|
|3|137|1,524|2|1|
|4|134|1,458|0|0|

Full logs `/tmp/cr2/shard1.log` through `/tmp/cr2/shard4.log`; failing shard 3 output retained in full. No new test failure. Existing profile tests remain unchanged.

## Named pre-existing failures from CR1
- `src/test/ep2EditProfileYou.test.tsx:66:19` — “toggle starts off when the display name is first + last, and Golfers see follows it”: `TestingLibraryElementError: Found multiple elements with the role "switch"`.
- `src/test/ep2EditProfileYou.test.tsx:77:19` — “toggle starts on for a differing display name”: same exact error.

These broad role queries find the CR1 Creator switch and existing Name-sheet switch. No unauthorised correction made.

## Build status: NOT clean (four pre-existing CR1 errors)
Latest automatic typecheck output, verbatim:
```text
=== build 2026-11-02T18:56:49Z ===
--- typecheck ---
src/hooks/useUserProfile.tsx(121,15): error TS2352: Conversion of type '{ actor_type: string; background_image_url: string; bio: string; city: string; college_id: string; country: string; cover_photo_url: string; created_at: string; display_name: string; eg_handicap_index: number; ... 27 more ...; youtube_handle: string; }' to type 'UserProfile' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
Property 'is_creator' is missing in type '{ actor_type: string; background_image_url: string; bio: string; city: string; college_id: string; country: string; cover_photo_url: string; created_at: string; display_name: string; eg_handicap_index: number; ... 27 more ...; youtube_handle: string; }' but required in type 'UserProfile'.
src/test/cr1CreatorChoice.test.tsx(48,55): error TS2550: Property 'hasOwn' does not exist on type 'ObjectConstructor'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2022' or later.
src/test/ep3EditProfileGolf.test.tsx(34,7): error TS2741: Property 'isCreator' is missing in type '{ displayName: string; username: string; firstName: string; lastName: string; bio: string; city: string; country: string; gender: string; profilePhotoUrl: null; headerPhotoUrl: null; profilePhotoBlob: null; headerPhotoBlob: null; homeClubName: string; primaryClubId: null; ... 10 more ...; youtubeHandle: string; }' but required in type 'ProfileFormData'.
src/test/ep4LinksPrivacy.test.tsx(45,7): error TS2741: Property 'isCreator' is missing in type '{ displayName: string; username: string; firstName: string; lastName: string; bio: string; city: string; country: string; gender: string; profilePhotoUrl: null; headerPhotoUrl: null; profilePhotoBlob: null; headerPhotoBlob: null; homeClubName: string; primaryClubId: null; ... 10 more ...; youtubeHandle: string; }' but required in type 'ProfileFormData'.
```
The initial CR2 import typo (`@/lib/shortCourseName`) was an intermediate edit state corrected to the existing `@/lib/courses/shortCourseName` before verification; no CR2 error survives in the newest output. No manual build/typecheck run.

## New case names (+8)
- creator label is present only when enabled and is a sibling of the name
- creator defaults to Videos while a non-creator defaults to Posts
- non-creator video links resolve to Posts
- no implicit Posts content is selected during creator loading
- creator summary never reads when signed out
- chips switch the server kind and tiles open the loaded list at the tapped index
- round pill uses m:ss or N videos and isolates the scorecard tap
- round video collector does not read without a signed-in viewer

## Verification limits
No authenticated browser readback or requested screenshots: external_unmanaged Supabase authentication prevents managed signed-in checks, and surviving CR1 build errors retain the stop gate. No claim of exact on-device/mock parity. Existing faded elements win over mock: today's personal hero, own Handicap tab, Courses panels, expanded Rounds sections and canonical text-only profile navigation all remain; mock photographic gradient placeholders and faded counter examples were not copied.

Tests exercise the presentational label, pure default/normalisation/loading rules, RPC kind change and fullscreen index, pill labels/isolation, signed-out summary/collector guards. They do not yet exercise the complete ProfilePageV2 navigation/skeleton with a real live member or non-creator whole-page absence/read gate; those integration and screenshot checks remain open.

## Architecture ownership
New profileCreator.ts, ProfileVideosTab.tsx and ProfileRoundVideos.tsx headers hold their module-specific read/adapter/player ownership rules. ProfileHero's optional isCreator prop keeps the read at the page, matching its existing coach-line pattern; no hero imports the read. Root AGENTS.md unchanged given the previously reported budget gate.

## Files touched by CR2
- src/features/creator/profileCreator.ts
- src/features/creator/ProfileVideosTab.tsx
- src/features/creator/ProfileRoundVideos.tsx
- src/features/creator/profile-creator.css
- src/components/profile/hero/ProfileCoverBand.tsx
- src/components/profile/hero/ProfileHero.tsx
- src/components/profile/rounds/ProfileRoundsTab.tsx
- src/pages/ProfilePageV2.tsx
- src/index.css
- src/test/cr2CreatorProfile.test.tsx
- roadmap.md
- CR2_REPORT.md

No SQL, migrations or migration files; no deployed RPC/edge function edits; no feed_config, round_pool_cap, native/Median configuration, guest browsing, review wizard, news or round plots edits. CR1 blockers not changed.
