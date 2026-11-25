# Brief 21 report

## Part E audit — reads feeding groupActivity

| Read | Source | Loading flag used | Limit / window | Key | Stable across sessions |
|---|---|---|---|---|---|
| Rounds | `get_recent_rounds` (p_scope everyone), `usePlayedRounds.rounds` | `settled(played.rounds)` | 30-day window (`ACTIVITY_WINDOW_DAYS`), pages of 100, cap 500 (`PLAYED_ROUND_CAP`) | `round:<whs_score_id>` | Yes — server id |
| Posts | `posts` (published, course_id or tagged ids), `usePlayedRounds.posts` | `settled(played.posts)` | `created_at >= now − 30 days`, pages of 100, cap 500 (`ACTIVITY_CAP`), then `countsAsActivity` | `post:<id>` | Yes — row id |
| Reviews | `course_ratings` (is_mock false, review not null), `usePlayedRounds.reviews` | `settled(played.reviews)` | `created_at >= now − 30 days`, pages of 100, cap 500 | `review:<id>` | Yes — row id |
| Faces | `readMemberFaces(memberIds)`, `usePlayedRounds.faces` | `settled(played.faces)` (only when memberIds) | none; names/photos only | none — adds no keys | n/a |

Courses (`played.courses`) only filters groups to known courses; it adds no keys.

Cause confirmed: the old owner wrote `ringKeys(current)` as soon as a tile showed, even while posts/reviews were still pending (the new test fails on the old code with `expected { sun: [ 'round:1' ] } to deeply equal {}`). Once later reads reordered the rings the default ring changed, so the earlier course was never rewritten and its late keys read as new on the next open.

Note: the 30-day window means a key ageing out never makes a ring amber (amber needs a key missing from the stored set, not the reverse).

## Parts G–I

- G `1c2300b679` — Confirm home club (HomeClubPickerSheet) and the dark RequestCourseCTA primary use A.INK (#F8FAFC) with GP.onInk text and icons; light CTA keeps amber. KeyboardClubSearchSheet's Confirm is a ghost row, not a primary button, so it was left unchanged. New `brief21HomeClubButtons.test.tsx` (3).
- H `29ba481c35` — videoPoster runs one global queue (concurrency 1), one <video> per source drawing all its times by seeking, torn down when its queue empties; 480px long-edge cap; a null job retries once at the back of the queue; SlideThumb and CoverFrame shimmer while pending and fall back to the existing poster (posterUrl or Stream thumbnail) or the surface with the play glyph. New `brief21VideoStills.test.ts` (3).
- I `ef7c7c734e` — ProfileVideosTab renders every video as the same tile; long-form wrapper, title and age removed with their CSS; usePostVideoDetails dropped from the tab (still used elsewhere). New `brief21VideosGrid.test.tsx` (2; the 172px row is asserted from the stylesheet, since jsdom has no layout).
  - Changed test `pf3bVideoSurfaces.test.tsx:35`, authorised as encoding the replaced rule: old `expect(...querySelectorAll('.profile-video-long')).toHaveLength(1)` / title `toBe('Preferred title')` / age `not.toBe('')` → new `.profile-video-long` `toHaveLength(0)`, title and age `toBeNull()`, text `not.toContain('Preferred title')`; the two Play video buttons assertion is unchanged.

## Shard run — STOPPED at shard 1/4

Shard 1/4: 2,519/2,519 tests passed across 230 files, but Vitest reported 1 unhandled error, so the run stopped there:

```
ReferenceError: document is not defined
 ❯ Timeout.restoreChromeAfterLanding src/components/fullscreen-feed/FullscreenFeedOverlay.tsx:813:11
This error originated in "src/test/brief20OverlayRendered.test.tsx" ... caught after test environment was torn down.
```

A FullscreenFeedOverlay timer fires after the Brief 20 rendered-layer test tears down its environment. None of G–I touches either file. Shards 2–4 were not run. Full log is kept outside the repo at /root/shards21/s1.log.
