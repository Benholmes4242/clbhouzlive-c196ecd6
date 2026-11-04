# FIX_UPLOAD_PLAYER_1

## Delivered
- Admin `uploadCoursePhoto` calls `uploadToR2Only(file, 'clbhouz-course-images', course-photos/courseId-timestamp.extension)` once. It writes the returned public URL unchanged to `golf_courses.thumbnail_image` and returns it. Failed or URL-less uploads throw before the thumbnail update. No Supabase storage call remains in the function.
- The existing photo mutation shows the actual error message as the toast description. All existing drawer/Inbox/create-and-attach callers remain unchanged.
- PlayerPage now uses direct `paddingTop:CHROME_CLEARANCE`; its hero and all other player behavior remain unchanged. The current source already had no `var(--island-clearance)` and the bleeding guard already had zero named exceptions. The remaining player-specific subtraction branch was removed from the measured-clearance assertion; the guard comment explicitly says zero exceptions.

## Exact existing test diffs
Only `src/test/fixGridClearance.test.ts` was rewritten; no tests were deleted or renamed.

Parameterized case: `%s consumes measured clearance instead of the old reservation` (five instances):
- Before import assertion: `/import\s*\{\s*CHROME_CLEARANCE(?:,\s*CHROME_BREATHING)?\s*\}\s*from\s*['"]@\/lib\/chromeClearance['"]/`.
- After: `/import\s*\{\s*CHROME_CLEARANCE\s*\}\s*from\s*['"]@\/lib\/chromeClearance['"]/`.
- Before PlayerPage branch: `expect(source).toContain('paddingTop:\u0060calc(${CHROME_CLEARANCE} - ${CHROME_BREATHING + 10}px)\u0060')`.
- After, all five cases: `expect(source).toMatch(/paddingTop:\s*(?:headerB\s*\?\s*)?CHROME_CLEARANCE/)`.
- Reason: the brief requires the direct clearance token, not the older notch-audit subtraction. Existing no-old-token assertion retained.

`no bleeding page or shared shell consumes old clearance`: assertion unchanged (`expect(violations, ...).toEqual([])`); only added comment `Zero exceptions: every bleeding page and shared shell is checked.` No exception list existed to remove at this baseline.

## New tests and count reconciliation
`src/test/adminCoursePhotoR2.test.ts` adds four cases:
1. `uploads once to the course R2 bucket and writes the returned public URL without storage calls`.
2. `throws the R2 error x without updating golf_courses`.
3. `rejects a missing public URL with Upload failed without updating golf_courses`.
4. `no admin source calls supabase.storage upload, including multiline chains`.

Previous reported baseline: **6,599 tests / 582 files** (`OUR_RECORD_V2_REPORT.md`). After: **6,603 tests / 583 files**. Delta: exactly these four new tests and one new file. Existing guard edits change no counts.

Focused command: `bunx vitest run src/test/adminCoursePhotoR2.test.ts src/test/fixGridClearance.test.ts src/test/playerRebuildPage.test.tsx --maxWorkers=2`: **27/27**, three files.

Full-suite command for each shard: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed tests | Passed files | Failures | Unhandled errors |
| --- | ---: | ---: | ---: | ---: |
| 1/4 | 1,705 | 146 | 0 | 0 |
| 2/4 | 1,569 | 146 | 0 | 0 |
| 3/4 | 1,663 | 146 | 0 | 0 |
| 4/4 | 1,666 | 145 | 0 | 0 |
| Total | **6,603** | **583** | **0** | **0** |

No pre-existing failures were observed. Full focused and shard output retained under `docs/verification/fix-upload-player-1/`. Automatic build log latest entry: `build 2026-11-04T08:22:48Z — build OK`; no manual build/typecheck run.

## Other direct Supabase storage uploads (unchanged)
Audit includes multiline call chains; three other source files remain:
- `src/features/comments-v2/components/CommentComposer.tsx:131` — `comment-images`: compressed image attachment in a comment.
- `src/hooks/messaging/uploadMessageMedia.ts:82–84` — `message-media`: conversation image/voice attachments, stored under conversation ID and generated UUID.
- `src/components/business/verification/VerificationFlowSheet.tsx:380–382` — `DOC_BUCKET = 'business-verification-docs'`: business verification evidence/document upload. Its separate removal call is not an upload.

These are inventory only; none was changed.

## Files touched
- `src/features/admin/hooks/useCourses.ts`
- `src/features/tourhub/player-v2/PlayerPage.tsx`
- `src/test/fixGridClearance.test.ts`
- `src/test/adminCoursePhotoR2.test.ts` (new)
- `roadmap.md`
- `FIX_UPLOAD_PLAYER_1_REPORT.md` (new)
- `docs/verification/fix-upload-player-1/focused.log` (new)
- `docs/verification/fix-upload-player-1/shard-1.log` (new)
- `docs/verification/fix-upload-player-1/shard-2.log` (new)
- `docs/verification/fix-upload-player-1/shard-3.log` (new)
- `docs/verification/fix-upload-player-1/shard-4.log` (new)
- Project memory: `mem://constraints/admin-course-photo-r2.md` (new), `mem://index.md`.

Local ownership documented in the uploader and player file headers; no new module architecture introduced.

## Verification limits and scope
Real authenticated admin upload/read-back was not browser-verified: this project's browser auth status is `external_unmanaged`, so managed authenticated end-to-end checks are unavailable. No credentials requested, auth bypass, forced click or replacement-photo write attempted. Unit tests exercise actual `uploadCoursePhoto` with the explicitly requested mocked R2 result and inspect the thumbnail write.

No SQL, migrations/migration files, deployed RPC/edge function, native/Median changes. R2 helper/guard, guest browsing, review wizard, news, round plots and `feed_config` untouched; `round_pool_cap` remains30.