# Hybrid Post Composer — replace Post Studio

Per `hybrid-post-composer-build-brief.md`. One simple composer that forks Post vs Review at the top. POST path publishes via existing `usePostSubmission`. REVIEW path routes into the existing ReviewWizard (`/courses/:id/rate`) — no review-model changes.

## Locked decisions (from brief)
- No @mentions, no drafts, no scheduling, no success screen, no trim/poster.
- Single course tag on a post (not multi).
- Video allowed (existing Cloudflare Stream path), no editing UI.
- Business actor: read-only "Posting as {name}" in header; Review toggle disabled for business.
- Keep `usePostStudioStore` (open/close + entry params) and `usePostSubmission` (publish primitive).

## Part 1 — Build new composer
Create `src/components/post-composer/PostComposer.tsx` (~200 lines, sheet on mobile / modal on desktop). Local state only: `{ mode: 'post'|'review', caption, mediaFiles, taggedCourse, isPublishing }`.

Layout:
1. Header: X (left) · segmented `[ Post | Review ]` (center) · Post button (right, POST mode only, disabled until caption or media). Subline "Posting as {displayName}" with business name/avatar when business.
2. POST body: autofocus caption textarea (max 2000, counter shown within 100 of cap); `＋ Tag a course` chip that opens a single-select course-search sheet (lift `golf_courses` query out of `CourseTagPanel`); `＋ Add photos` tile with horizontal thumbnails (× to remove); Post button calls `usePostSubmission.submitPost({...})` → toast → close → return to `returnPath`.
3. REVIEW body: heading + sub copy + prominent course search; selecting a course → `navigate('/courses/${id}/rate')` + close composer.

Create `src/components/post-composer/CourseSearchSheet.tsx` — reuses the existing `golf_courses` Supabase search from `CourseTagPanel` (lifted, single-select, no numbered pills). Shared by Post-mode tag chip and Review-mode search.

Extend `usePostSubmission.submitPost` to accept `actorType` / `actorId` (currently hardcodes `personal`/`user.id`) and to associate `courseInfo` with the inserted post. Keep media-upload pipeline intact.

## Part 2 — Switch entry points
- `src/components/post-studio/GlobalPostStudio.tsx` → render `<PostComposer/>` instead of `<PostStudio/>` (keep same store wiring + `returnPath` close behavior).
- Verify `GlobalBottomNavigation` (Share), `BusinessProfilePosts` (business actor), `CreatePostDialog` all open the new composer.

## Part 3 — Delete old studio (after Part 2 verified)
Delete:
- `src/components/post-studio/{PostStudio.tsx, usePostStudio.tsx, constants.ts, tokens.ts, types.ts, index.ts}`
- `src/components/post-studio/screens/` (ComposeScreen, TrimScreen, PosterScreen, SuccessScreen)
- `src/components/post-studio/panels/` (CourseTagPanel after lifting search, AudiencePanel, SchedulePanel, MentionPanel, DraftsPanel)
- `src/components/post-studio/components/` (ActorSelector, VideoTrimmer, PosterPicker, MediaReel, MediaPreview, CharacterRing, MentionPill, PostTypeChip, ManageMediaSheet, ConfirmRemoveSheet, CinematicHero, StudioHeader)
- `src/components/post-studio/hooks/useSaveDraft.ts`
- `src/hooks/useDrafts.ts` only if no remaining callers (verify first; if `services/drafts/*` consumers exist, leave alone).

Keep: `usePostStudioStore`, `usePostSubmission` + `PostSubmissionHandler`, entire review-wizard tree, `RateCoursePage`, `/rate` route, `GlobalPostStudio` mount (now rendering `PostComposer`).

Move `GlobalPostStudio.tsx` into `post-composer/` (rename file but keep store name to avoid churn at the 3 call sites).

## Part 4 — Drafts/schedule data (separate)
Composer never writes `drafts` or `scheduled_at`. Do not delete any `post_drafts` rows or scheduled-post cron. Audit for active crons that publish scheduled posts and flag them in a follow-up — no schema changes required for this work.

## Verification
- `tsc --noEmit` clean.
- `rg "post-studio"` after Part 3: zero hits (composer folder only).
- `rg "useSaveDraft|SchedulePanel|TrimScreen|PosterScreen|MentionPanel"`: zero.
- Device walk: Share → Post mode → caption + media + course tag → publish → toast + feed. Toggle Review → search course → routes to `/courses/:id/rate` → wizard owns the rest. Business profile → "Posting as {biz}", Review toggle disabled.

## Technical notes
- `usePostSubmission` will gain optional `actorType` (default `'personal'`) and `actorId` (default `user.id`) and write them on the `posts` insert. `courseInfo.id` will be written as `posts.course_id` (matches existing schema used by `createPost`).
- Course search lifted out of `CourseTagPanel` is the only piece preserved from the old `panels/`. Lift before deleting the file.
- The composer renders as a `Sheet` (bottom on mobile) / centered `Dialog` (desktop) using existing shadcn primitives + design tokens (no custom color classes).
- No new dependencies.
