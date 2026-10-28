# Review a course search sheet

Files changed
- NEW src/features/composer-flow/ReviewCourseSearchSheet.tsx, review-course-search.css, reviewCourseSearchRules.ts, hooks/useReviewCourseSearch.ts
- NEW src/lib/recentCourseViews.ts
- src/features/composer-flow/ComposerFlowSheet.tsx — "Find a course to review" opens the new sheet; pick still fires composer_course_source { source: 'search' } and uses beginHandoff + close-first navigation.
- src/pages/CourseDetailPage.tsx — records a recent view on mount.
- src/features/admin/lib/eventLabels.ts — three new labels.
- src/features/post-v2/components/CourseTagSheet.tsx — review-only branch removed (nothing else passed excludeReviewedForUserId): the prop, the reviewed-ids read and the amber REVIEWED badge. Post tagging is otherwise unchanged (autofocus, search, popular list). usePopularCourses still accepts its excludeReviewedForUserId option, now unused; left in place.

Tests
- NEW src/test/reviewCourseSearch.test.tsx (18 tests).
- REWRITTEN src/test/postOrReviewSheet.test.tsx, "search uses the existing single-course picker and only navigates after close settles" -> "search opens the Review a course sheet and only navigates after close settles". Removed assertions: `expect(h.picker.title).toBe('Find a course to review')`, `expect(h.picker.selectionMode).toBe('single')`, `expect(h.picker.excludeReviewedForUserId).toBe('member')` — the brief replaces CourseTagSheet here. Mock now targets ReviewCourseSearchSheet; close-first navigation, handoff and analytics assertions kept.
- Full suite: 4,220 / 443 files -> 4,238 / 444 files (+18 = new file). 4,237 passed, 1 failed: src/test/ob1Welcome.test.tsx "cropper has no slider, grid or reset and Use photo hands the file to the existing upload" (upload spy 0 calls) — the known onboarding flake; passes 74/74 in isolation; no file of it touched.

Notes
- Threshold list scans the newest 300 non-mock reviews; popular counts up to 1,000 reviews from the last 30 days.
- Mock shows Gleneagles (King's) unhighlighted for "Kin"; the brief's "wherever the match falls" was followed, so "Kin" in "King's" is highlighted.
- Placeholder "Search 23,000 courses" is the signed-off copy, kept verbatim.
