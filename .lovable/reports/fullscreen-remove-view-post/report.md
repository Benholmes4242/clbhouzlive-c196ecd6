# Fullscreen course photos — remove View post

## Implemented; verification stopped
Removed the source-shot View post block without replacement/spacing, removed the now-unused handleViewSourcePost and its explanatory comment, and updated the header. shotSourcePostId, confirmedSourcePostIds, hasPostActions, stackBottom, source action targets and frozen viewer siblings are unchanged. CourseGalleryChrome and all other View post buttons untouched. No SQL, migrations, feed_config or round_pool_cap changes.

Focused files passed **60/60**. Sequential full shards one and two passed; shard three had one unexpected failure in an untouched guest-navigation test. **Stopped immediately: no repair, rerun, shard four or screenshots.**

```text
FAIL src/test/guestStage24.test.tsx > Stage 2.4 — guests on /auth > after a guest signs in as a member, Auth redirects once
AssertionError: expected [ '/auth' ] to deeply equal [ '/auth', '/' ]

- Expected
+ Received

  [
    "/auth",
-   "/",
  ]

 ❯ src/test/guestStage24.test.tsx:85:18
     83|     expect(h.route).toHaveBeenCalledTimes(1);
     84|     expect(h.route).toHaveBeenCalledWith('m1', null);
     85|     expect(navs).toEqual(['/auth', '/']);
       |                  ^
```

## Files changed
- src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx — button, unused handler and its comment removed; header updated only. Existing useLocation import/call retained rather than broadening the brief's “and only it” cleanup instruction.
- src/test/pf2HoleGuide.test.tsx — only the authorised cases below.
- src/test/canonicalFullscreenViewer.test.tsx — only the authorised assertion below; every pills assertion unchanged.
- roadmap.md and this report folder — status and complete logs.

## Every test/assertion change — old → new
In pf2HoleGuide describe `PF2 View post line in the canonical viewer`:
1. Case name `renders only with a sourcePostId, on its own line in the Full review style` → `never renders a View post line, with or without a sourcePostId`.
   Why: source-backed and source-less course photos both lose this line.
   - `expect(screen.getByRole('button', { name: 'View post' })).toBeTruthy()` → `expect(screen.queryByRole('button', { name: 'View post' })).toBeNull()` for shotItem('post-1').
   - `expect(container.querySelector('[data-fullscreen-view-post]')).not.toBeNull()` → `expect(container.querySelector('[data-fullscreen-view-post]')).toBeNull()` for shotItem('post-1').
   - After shotItem(null), existing queryByRole null assertion unchanged; added `expect(container.querySelector('[data-fullscreen-view-post]')).toBeNull()` as expressly requested for both source states.
2. **Deleted** case `the tap opens the post and never reaches the slide`.
   Deleted assertion: `expect(onSlideTap).not.toHaveBeenCalled()` after firing the View post click.
   Why: explicitly authorised deletion because that button no longer exists. No other case deleted.
3. Case name `video shots keep View post in the stack with the canonical video row below it` → `video shots show the canonical video row with no View post`.
   - `expect(container.querySelector('[data-fullscreen-stack] [data-fullscreen-view-post]')).not.toBeNull()` → `expect(container.querySelector('[data-fullscreen-stack] [data-fullscreen-view-post]')).toBeNull()`.
   - Existing `[data-fullscreen-video-row]` present assertion unchanged.
   Why: retain the video row while removing the line above it.
4. canonicalFullscreenViewer original line 97:
   `expect(screen.getByRole('button', { name: 'View post' })).toBeInTheDocument()` → `expect(screen.queryByRole('button', { name: 'View post' })).toBeNull()`.
   Why: resolved source posts still provide pills but no View post button. Case name and every pills assertion unchanged.

No other tests/assertions/mocks changed. viewPost1Navigation.test.tsx and postFlowScreens.test.tsx pass untouched.

## Counts and commands
Last verified baseline **9,400 / 9,400 across 841 files**. After this request: **expected inventory 9,399 across 841 files**, full pass **unverified**. Only delta **−1**: pf2HoleGuide.test.tsx goes 14 → 13 by deleting `the tap opens the post and never reaches the slide`. Two authorised case renames retain their cases; no added tests.

| Command | Files | Passed / failed / executed | Full output |
|---|---:|---:|---|
| `bunx vitest run src/test/pf2HoleGuide.test.tsx src/test/canonicalFullscreenViewer.test.tsx src/test/viewPost1Navigation.test.tsx src/test/postFlowScreens.test.tsx` | 4 passed | 60 / 0 / 60 | focused.log |
| `bunx vitest run --shard=1/4` | 211 passed | 2,311 / 0 / 2,311 | shard-1.log |
| `bunx vitest run --shard=2/4` | 211 passed | 2,292 / 0 / 2,292 | shard-2.log |
| `bunx vitest run --shard=3/4` | 210 passed, 1 failed | 2,348 / 1 / 2,349 | shard-3.log |
| `bunx vitest run --shard=4/4` | — | Not run — stop rule | — |

Full-suite execution so far: **6,952 executed / 6,951 passed / 1 failed**, excluding duplicate focused checks. Remaining expected 2,447 tests unrun. Focused counts: pf2HoleGuide 13, canonicalFullscreenViewer 13, viewPost1Navigation 13, postFlowScreens 21.

## Screenshots and preview
Requested source-backed Sundridge video / Woking photo at 390 and 320: **not captured**, because the shard-three failure invoked the explicit stop rule before browser verification. No old screenshot offered as evidence for this change. Real authenticated gallery checks also remain unavailable with external_unmanaged access.
Latest observed preview harness entry: `=== build 2026-11-21T08:43:51Z ===` / `build OK`.
