# EP5.1 — Stop report

## Status
Requested source changes implemented; **full suite passes 4,386/4,386 across 451 files**, but the automatic typecheck is not clean. Stopped without correcting the new test helper or changing further source/tests.

Automatic check `2026-10-29T06:32:13Z`:
```text
src/test/ep51SearchAndCarets.test.tsx(20,551): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```
The offending new test passes `{ name: 'Clear', exact: true }` to `getByRole`. It executes successfully in Vitest but the installed type definitions reject `exact`. No pre-existing test or type failures were observed. Latest prior automatic build was OK at `06:31:32Z`; the final preview is **not build-clean** because of this surviving type error.

## Implemented diff
- Removed avatar square box-shadow; 76px SquircleAvatar uses canonical hairline ring, plus badge unchanged.
- Edit profile top is safe area +14px with safe-area-aware minimum for its 36px back button; create-business frame top is +14px, minimum 48px as setup. Business cropper head now +16px as setup; Edit profile already consumes that setup cropper.
- Both editor tabs have a scrolling `.ep-body` and bottom padding `calc(24px + env(safe-area-inset-bottom,0px))`.
- Scoped the shared 14px muted label selector to the editor. All existing groups already use that same class, including Coach.
- Extracted KeyboardSearchSheet: content-height up to shared 85dvh/headroom cap and first-character hold until clear/close. Review remains undocked and not autofocused. Club-only autofocus and keyboard height offset; results above field.
- Opt-in singleton club picker keeps legacy callers unchanged. Editor Home club opens directly; Other clubs retains remove/list UI and Add a club opens the same search. Canonical club search, confirmation, callback selection, default mutation, pending explanation and home-club course-request path retained.

## Every cursor change (current lines)
| File | Line | Old → new |
|---|---:|---|
| `src/index.css` | 25 | No default → base-layer `input, textarea, [contenteditable="true"] { caret-color: #F8FAFC; }`, no important |
| `src/components/courses/CourseSearchSheet.tsx` | 244 | `caretColor: '#F7931E'` → `'#F8FAFC'` |
| `src/features/messaging-dark/messages-dark.css` | 89 | `caret-color: #f7931e` → `#F8FAFC` |
| `src/pages/BusinessInvitePage.tsx` | 318 | `caretColor: '#F7931E'` → `INK` (existing `#F8FAFC`) |
| `src/features/business-create/business-create.css` | 25 | `var(--bizc-ink)` → `var(--bizc-ink,#F8FAFC)` |
| `src/features/business-create/business-create.css` | 71 | `var(--bizc-ink)` → `var(--bizc-ink,#F8FAFC)` |

Sweep finds no further explicit amber/primary caret in source. Existing white/grey carets remain unchanged. Base-layer default does not override explicit mentions/composer caret settings.

## Tests and inventory
Baseline **4,378/4,378 / 450 files** from Review course height fix.
- `bunx vitest run src/test/ep51SearchAndCarets.test.tsx src/test/reviewCourseSearch.test.tsx src/test/ep3EditProfileGolf.test.tsx src/test/ep5Completion.test.tsx`: **91/91 across four files**.
- `bunx vitest run`: **4,386/4,386 across 451 files**, zero failures, duration355.24s.
- Delta **+8 cases / +1 file**, solely `src/test/ep51SearchAndCarets.test.tsx`: review no-focus/no-dock; club focus/dock; club typing hold; confirmation callback/no-second-writer; default canonical mutation; pending confirmation disabled; home-club prefilled request; global white default/no amber caret sweep.
- No cases deleted or renamed. Existing review-search tests (20 cases) and browser regression are **unchanged** and green.

Authorized existing case changes (old → new):
1. `src/test/ep3EditProfileGolf.test.tsx`, `home club selection saves name and primary id together`: old extra `fireEvent.click(... /Search clubs/)` → direct picker assertion `expect(h.picker).toHaveBeenCalledWith(expect.objectContaining({ keyboardSearch: true }))`; exact save assertion stays `toHaveBeenCalledWith('homeClub', { homeClubName: 'Park Golf Club', primaryClubId: 'park' })`. Reason: the old intermediate panel was explicitly removed.
2. `src/test/ep5Completion.test.tsx`, `homeClub chip opens the existing editor`: old `expect(screen.getByTestId('ep-sheet-homeClub')).toBeInTheDocument()` → `expect(h.picker).toHaveBeenCalledWith(expect.objectContaining({ keyboardSearch: true }))`. Reason: chip now opens singleton keyboard search directly; other parameterized cases unchanged.
3. `src/test/ep5Completion.test.tsx`, `nudge_club opens on arrival`: same old sheet-presence assertion → same keyboard-picker assertion. Reason: arrival opens the same direct selection path. Added/reset a picker mock; no other case assertions changed.

`python3 tests/browser/test_review_course_search_height.py` passes unchanged after extraction: 349px two-list sheet, unchanged hold, 668.09px long sheet at430×786 against85dvh668.1px, list-only scroll and clear release. This uses controlled rows, not live signed-in reads.

## Every changed project file
1. `AGENTS.md` — search-shell ownership pointer replaces editor-group pointer; old note moved verbatim to EditProfileGolf header to respect size cap.
2. `roadmap.md`.
3. `src/features/composer-flow/KeyboardSearchSheet.tsx` — new shared shell.
4. `src/features/composer-flow/ReviewCourseSearchSheet.tsx` — adopts shell; feature logic unchanged.
5. `src/features/composer-flow/review-course-search.css` — club mode ordering, clear button geometry.
6. `src/features/home-club/KeyboardClubSearchSheet.tsx` — new opt-in club presentation.
7. `src/features/home-club/homeClubPickerStore.ts` — opt-in keyboard mode/pending context.
8. `src/features/home-club/HomeClubPickerHost.tsx` — opt-in mode hosting.
9. `src/features/edit-profile/EditProfileGolf.tsx` — direct club entrypoints, old search panel removed.
10. `src/features/edit-profile/EditProfileCard.tsx` — hairline avatar.
11. `src/features/edit-profile/edit-profile.css` — framing, safe areas, label specificity.
12. `src/pages/EditProfile.tsx` — scrolling Settings wrapper.
13. `src/features/business-create/business-create.css` — frame/cropper offsets and caret fallbacks.
14. `src/index.css` — global caret default.
15. `src/components/courses/CourseSearchSheet.tsx` — white caret.
16. `src/pages/BusinessInvitePage.tsx` — white caret.
17. `src/features/messaging-dark/messages-dark.css` — white caret.
18. `src/test/ep3EditProfileGolf.test.tsx` — authorized direct entry assertion.
19. `src/test/ep5Completion.test.tsx` — authorized completion/arrival expectations.
20. `src/test/ep51SearchAndCarets.test.tsx` — eight new regressions; contains blocking helper type error.
21. `EP5_1_STOP_REPORT.md` — this report.

Project memory: added `mem://features/profile/ep51-ruling` and index entry for Ben's clarified club-only focus/docking requirement.

## Remaining verification
No further source/test changes, reruns or visual checks after surviving-error stop. Avatar/frame/all-label visual verification and additional CSS/browser regression checks are not completed. Authenticated end-to-end checks are unavailable for external-unmanaged auth; native keyboard behaviour was not exercised. No manual project typecheck/build was run.

No SQL, migrations, migration files, deployed RPC/edge edits, feed_config changes, cap changes or native/Median configuration changes.