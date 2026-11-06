# VIEW_POST_1 — close-out green

## Authorized test-only close-out
Completed 2026-11-06. Production code and every other test file were unchanged in this continuation. Only the approved browser-history setup and one sibling case were added to `src/test/viewPost1Navigation.test.tsx`; existing assertions stayed byte-identical. The file already has afterEach cleanup with `vi.restoreAllMocks()`, and both cases explicitly restore their history spy too.

Focused command documented below rerun: **67/67 passed across 7 files**.

Each fresh shard ran as its own command, in order:
```sh
bunx vitest run --maxWorkers=2 --shard=1/4
bunx vitest run --maxWorkers=2 --shard=2/4
bunx vitest run --maxWorkers=2 --shard=3/4
bunx vitest run --maxWorkers=2 --shard=4/4
```

| Shard | Passed | Failed | Files |
|---|---:|---:|---:|
| 1 | 1,873 | 0 | 159 |
| 2 | 1,729 | 0 | 159 |
| 3 | 1,849 | 0 | 159 |
| 4 | 1,773 | 0 | 159 |
| **Total** | **7,224** | **0** | **636** |

Known failures, reported separately: **none appeared**. fsNotch1 passes6/6, fullscreenBand19/19, tourIsland14/14. No unexpected failures or reruns. CLOSE_OUT_1's three portrait fixes remain green; this continuation did not touch those files.

Full-suite baseline was7,205 tests/633 files. VIEW_POST_1 originally added18 tests/3 files, and this close-out adds1 sibling: **7,205+18+1=7,224;633+3=636**. No test/file deleted or renamed. viewPost1Navigation12→13; focused66 executed (65 pass/1 fail)→67 passing, exactly fixed1+added1. Compared with the preceding expected inventory7,223/636, delta is exactly +1 named sibling. Shard membership redistributed; only full totals establish the delta.

### Changed test — old code
Case: `without closeTo a shared or notification link goes back unchanged`.
```tsx
  it('without closeTo a shared or notification link goes back unchanged', async () => {
    const open = mountLink(undefined, true);
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(open.mock.calls[0]?.[2]?.openCommentsInitially).toBe(true);
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'dismissed' } as never); });
    expect(screen.getByTestId('destination')).toHaveTextContent('/activity');
  });
```

### Changed test — new code
```tsx
  it('without closeTo a shared or notification link goes back unchanged', async () => {
    const len = vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    const open = mountLink(undefined, true);
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(open.mock.calls[0]?.[2]?.openCommentsInitially).toBe(true);
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'dismissed' } as never); });
    expect(screen.getByTestId('destination')).toHaveTextContent('/activity');
    len.mockRestore();
  });
```
Why: model actual browser-history length separately from MemoryRouter so the existing back branch is exercised; assertions were not rewritten.

### Added sibling
```tsx
  it('without closeTo and no browser history a shared link lands on Clubhouse', async () => {
    const len = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    const open = mountLink();
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'dismissed' } as never); });
    expect(screen.getByTestId('destination')).toHaveTextContent('/');
    len.mockRestore();
  });
```

All five new logs retained under `docs/verification/view-post-1/close-out/`; preceding failing focused log retained unchanged. Preview harness reports `build OK` at2026-11-06T07:04:48Z. No manual build/typecheck, SQL, migrations, production edits, deployed changes or other test changes in this close-out. Six authenticated/device checks remain unverified because auth is external unmanaged; suite-green does not establish those checks. Notification/shared-link history now has passing mounted coverage of both branches.

## Historical implementation and STOP evidence (superseded by green close-out above)

## Historical STOP
Unexpected failure in a new test; no failing assertion/fixture was edited and no shards were started.

```text
FAIL src/test/viewPost1Navigation.test.tsx > VIEW_POST_1 post deep-link close and processing fallback > without closeTo a shared or notification link goes back unchanged
Error: expect(element).toHaveTextContent()

Expected element to have text content:
  /activity
Received:
  /
❯ src/test/viewPost1Navigation.test.tsx:84:47
```

Diagnosis: production retains the original `window.history.length > 1` branch; this new test uses MemoryRouter history, while browser/jsdom window history remains length1. It therefore exercises the unchanged `/` fallback, not the back branch the test intended. Product no-closeTo handling was not altered to satisfy the fixture. A fixture-only authorization to model window history length>1 is needed before changing this failing new test. The current test remains untouched after its failure.

Full output retained: `docs/verification/view-post-1/focused.log`.

## Implemented scope
- StageComposer adds optional `onViewPost(postId, closeTo)` and success View post calls only that callback; personal `/profile`, business `/business/<posting actor id>`. Done remains unchanged.
- GlobalPostComposer closes only the studio, then navigates to `/post/<id>` with `state.closeTo`; old returnPath close handler remains for Done.
- PostV2Page replaces its finished composer entry when opening `/post/<id>`.
- PostDeepLinkPage opts into author close only when closeTo is supplied; reason `navigating` still takes precedence. Notification/shared links retain the original window-history decision and fallback.
- With closeTo, all-processing mapped media or refused open returns to the author with replace. An unpublished/no-row upload and media-less just-posted row also return to closeTo rather than an unavailable screen. Ordinary load/network error handling is unchanged.
- Fullscreen engine, PostSuccessV2 layout/copy/share, own-post exclusion and Done behavior untouched.

## Author-grid refresh audit and implementation
The actual mounted personal and business grids both consume `useProfilePosts` through `PostsTabContent`. BusinessProfilePage uses ClubFromTheClub for clubs and non-clubs; the older useBusinessPosts list is not the mounted grid (its count hook still is mounted).

Actual grid key:
`['profile-posts', actorType, actorId, activeViewerActorType, activeViewerActorId]`.
Older business list key:
`['actor-posts', 'business', actorId, 'v2']`.

Both grid readers omit a local refetchOnMount override; current App defaults are `true`. Creation events already invalidate the profile prefix, but post-v2's media controller emits upload completion, whose bridge previously invalidated only actor-posts/counts, not profile-posts. No claim that the default alone guarantees arrival freshness was made.

`post-v2/lib/refreshAuthorPosts.ts` now invalidates/refetches the author's `postKeys.profilePosts(actorType, actorId)` prefix with `refetchType: 'all'`, intentionally covering every cached viewer suffix and inactive grids. Business posts also refresh `postKeys.actorPosts('business', actorId)` with `refetchType: 'all'`, covering the v2 suffix. Other authors remain untouched.

Called after successful composer submit and again from UploadToastsBridge on non-scheduled post upload completion, which occurs after finalize_post_v2. This covers pending arrival and the later published-grid swap without changing feed filters. Pending cards already sort newest-first above the grid, scoped to existing author/viewer identities; their rules were not changed.

Three QueryClient regressions passed with `refetchOnMount:false` and infinite staleTime: inactive personal/business profile grids actually refetched and read back new-post first; inactive business v2 list refetched; other-author caches stayed uninvalidated. These are cache integration checks, not live hosted grid evidence.

## Tests and counts
Command:
```sh
bunx vitest run src/test/viewPost1Composer.test.tsx src/test/viewPost1Navigation.test.tsx src/test/viewPost1Refresh.test.tsx src/test/cb65BusinessFixes.test.tsx src/test/postFlowScreens.test.tsx src/features/post-v2/__tests__/postPhase3.test.ts src/test/previewFix1.test.tsx --maxWorkers=2
```
Focused: **65 passed +1 failed =66 tests;6 passed files +1 failed file =7**.
New tests: viewPost1Composer3/3, viewPost1Navigation11 passed/1 failed, viewPost1Refresh3/3.
Existing checks: cb65BusinessFixes8/8, postFlowScreens21/21 (including share-link/Done), postPhase3 9/9, previewFix1 10/10.

No existing test/fixture/assertion/case deleted, renamed or rewritten. New tests total18 in3 files:
- Composer: personal/business callback-only author handoff (2 parameterized cases); Done callbacks (1).
- Hosts: global View post isolation (1), global Done returnPath (1), post-v2 replace/history (1).
- Deep link: personal/business closeTo replace (2), unchanged shared-link back (1, failing), navigating no-op (1), refused-open return (1), processing return (1), unpublished return (1), missing shared-link unavailable (1), refused shared-link unavailable (1).
- Refetch: inactive personal/business grids (2); legacy business v2 list (1).

Last executed full-suite baseline:7,205 passed/633 files from CLOSE_OUT_1. Expected inventory after18 cases/3 new files:7,223 tests/636 files; **not an executed full-suite result**. No fresh full suite was run because focused checks stopped. Shards1–4: not run. TourIsland pre-existing failure did not appear in this focused selection; no other pre-existing failure appeared.

## Requested manual checks
Authentication status is `external_unmanaged`; authenticated end-to-end checks are unavailable here, and no credentials were requested or guest access changed.
1. Bottom-nav photo → View post → viewer close → own profile/new first: **live unverified**; composer/mount/viewer-close/refetch regressions passed.
2. Immediate video → open or processing profile, never unavailable: **live unverified**; refused/processing/unpublished fallback regressions passed.
3. Business post → correct business/new first: **live unverified**; business routing and cache regressions passed.
4. /post-v2 → profile; phone Back never reopens finished composer: **device/live unverified**; route-host replace/back regression passed.
5. Done unchanged, own posts excluded from Clubhouse: **live unverified**; Done/share existing tests passed, feed code untouched.
6. Notification/shared-link closes unchanged: **live unverified; focused fixture STOP above**. No-closeTo refusal/unavailable and comment intent tests passed, but intended history-back test failed due to jsdom window history.

Preview harness: `build OK` at2026-11-06T06:48:36Z. No manual build/typecheck. No SQL/migrations, deployed RPC/edge-function changes, feed_config edits, cap changes, native/Median changes, guest browsing/review wizard/news/round plot changes.