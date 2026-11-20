# Post/review wizard keyboard Done and scroll dismissal — stopped

## Files changed
- `src/lib/keyboard/useKeyboardDismiss.ts` — one shared hook. Text-like inputs, textarea and contenteditable focus are scoped to the wizard. Keyboard-up detection uses `innerHeight - visualViewport.height > 120`, with focus-only fallback when visualViewport is absent. Keyboard top is `offsetTop + height`, updated on resize/scroll. Dismiss blurs the active text field. Passive touch listeners dismiss above 12px vertical travel, except a scrollable focused field, mention/Played with result lists, or a horizontal swipe. Listeners clean up on unmount and rebind when StageComposer swaps scrollers.
- `src/lib/keyboard/KeyboardDonePill.tsx` — shared Button, only mounted while keyboardOpen. Body portal, fixed right 12px, bottom `innerHeight - keyboardTop + 10`, pointer-down preventDefault then dismiss, aria-label Close keyboard.
- `src/lib/zLayers.ts` — shared keyboard accessory layer 12001, below ordinary sheet backdrop 12002 and sheet 12003.
- `src/index.css` — semantic keyboard glass/edge/ink tokens and signed-off 34px / 16px / radius 999 / 14px / 700 pill styling; both backdrop-filter prefixes. Scoped two-class specificity preserves the requested shape against Button defaults. No font-family declared.
- `src/features/post-v2/StageComposer.tsx` — hook and pill; ref on both empty and populated main scrollers. No caption padding changes.
- `src/features/review-v2/ReviewComposerV2.tsx` — hook and pill; existing wizard root scopes focus and receives bubbling touches from the page-owned scroller. Review scrolling stays on its existing ancestor rather than introducing another scroll container or changing field padding.
- `src/components/mentions/MentionsComposerInput.tsx` — marker on the existing portalled suggestion panel so the keyboard dismissal exception is explicit; no panel placement or text changes. Played with results already have `.pf4-with-results`, used unchanged.
- `src/test/keyboardDismiss.test.tsx` — 11 new cases, below.
- `roadmap.md`, this report and `focused.log`.

Local ownership is documented in the new module headers; no unrelated root AGENTS.md rules moved or compressed. No SQL, migrations, feed_config or round_pool_cap changes. No changes to existing test files.

## Verification and stop

Exact command:
```text
bunx vitest run src/test/keyboardDismiss.test.tsx
```

**11 executed / 10 passed / 1 failed**, one file. Full stdout/stderr retained in `focused.log`.

Unexpected fixture failure:
```text
FAIL src/test/keyboardDismiss.test.tsx > wizard keyboard dismissal > (f) both real wizard shells show the shared pill while typing
TypeError: Cannot read properties of undefined (reading 'map')
❯ ActorSheet src/features/post-v2/components/ActorSheet.tsx:21:24
  {availableActors.map(a => {
```

The new useComposerActor fixture supplies activeActor/selectActor/applyDraftActor but omits availableActors. ActorSheet evaluates that map even while its sheet is closed. The post shell therefore throws before the keyboard assertion; the review iteration is not reached. No app safeguard, fixture repair, assertion rewrite or rerun was performed after the failure. A ruling is needed to complete this fixture and resume verification.

| Exact shard command | Totals |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run: focused failure stop |
| `bunx vitest run --shard=2/4` | Not run |
| `bunx vitest run --shard=3/4` | Not run |
| `bunx vitest run --shard=4/4` | Not run |

Preview harness: **2026-11-20T19:37:39Z — build OK**. No manual build/typecheck run.

## Test accounting

Existing tests edited/deleted/renamed/rewritten: **none**. Existing assertion old → new: **none**.

New file: **0 → 11 cases**, exact names:
1. `(a) shrunk viewport and focused review show Done ten pixels above keyboard; tap blurs and removes it`
2. `(b) twenty-pixel vertical page drag blurs the field`
3. `(c) a drag inside a scrollable focused textarea preserves focus`
4. `(d) horizontal media-tray swipe preserves focus`
5. `(e) no focused field means no pill and drags do nothing`
6. `(f) both real wizard shells show the shared pill while typing` — failed before assertion.
7. `mention and Played with result-list drags preserve focus`
8. `keyboard requires more than 120 pixels of viewport shrink and follows resize and scroll`
9. `a twelve-pixel drag keeps focus; thirteen pixels dismisses`
10. `without visualViewport focus alone opens the pill; non-text controls do not`
11. `unmount removes passive viewport and touch listeners`

Expected full-suite inventory: **9,362 → 9,373**, exactly +11 from this file. Last verified full-suite pass is **9,352**; intervening additions reconcile as +3 fullscreenStackAndUploadWhite, +7 reviewGridScores, +11 keyboardDismiss = expected 9,373. The previous stops remain untouched; neither 9,362 nor 9,373 is claimed as a verified full-suite pass.

## Mock and device comparison

No intentional deviation from changed mock material/geometry; the live control uses fixed layout coordinates and the shared Button rather than the mock's illustrative absolutely positioned span. Existing wizard layout, tap-outside handling, field padding and media/upload paths remain unchanged.

The passing isolated harness confirms 310px bottom at innerHeight 800 / viewport height 500, and follows an offsetTop change exactly. It does not establish physical iOS keyboard behaviour or 320px caption-corner clearance. Browser/320px screenshots and authenticated end-to-end wizard checks remain unverified after the stop; this project's externally managed Supabase does not supply an authenticated browser session. The signed-off HTML is reference-only, not embedded.