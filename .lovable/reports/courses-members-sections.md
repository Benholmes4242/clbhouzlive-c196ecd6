# BRIEF_COURSES_MEMBERS_SECTIONS — Latest holes pill + reviewer's rounds strip

## Built
- §1 `src/components/courses/browse/holePlays.ts` (new): rank row type, `playsFigure`
  (`level` / `+0.42` / `−0.15`), `rankPhrase` (rank 1 = "Hardest hole", else ordinal via the
  courses surface's own `ordinal` from `youBits`), `toRanksMap` (course AND hole keyed,
  incomplete rows dropped), `RANKS_MAX_IDS = 50`.
- `LatestHolesSection.tsx`: one `get_course_hole_ranks` read for the distinct loaded course
  ids (key `['gam_rpc','get_course_hole_ranks', sorted ids]`, `staleTime: 10 * 60_000`,
  batches of 50). Card shows the pill above the course name and extends its aria-label
  ("Hole 4, Ballybunion, plays +0.42, 3rd hardest hole"). Tile readiness unchanged: cards
  never wait on ranks; only the page-gate report does.
- `latestHoles.css`: `.latest-hole-plays` per the mock's `.plays` (inline-flex, baseline,
  gap 6, margin-bottom 8, padding 5px 9px, radius 999, rgba(10,10,12,.55), 1px
  rgba(255,255,255,.18), 11px/700 #FFFFFF, tabular; muted `em` 600 rgba(255,255,255,.7),
  max-width 100%, nowrap, overflow hidden, ellipsis). Under-par figure paints `TOPAR_RED`.
- §2 `src/components/courses/reviewAuthorRounds.ts` (new) + `useReviewAuthorRounds.ts` (new):
  one `get_review_author_rounds` read for the whole pool (key includes the viewer,
  `staleTime: 5 * 60_000`, ≤100 ids per call; pool cap is 80). `toParFigure` (+7 / E / −2),
  `roundsLabel` (1 = ROUND HERE), `bestLabel` (own = YOUR BEST).
- `ReviewRailSlot.tsx`: opt-in `authorRounds` / `viewerId` props; strip below the reviewer
  row (margin-top 10, gap 16, value 16/700 INK tabular, label 8.5/800/.14em INK_FAINT,
  to-par 11px INK_MUTE +2px, under par `TOPAR_RED`, no dividers). Absent row = no strip;
  null best = rounds only. Every other caller is unchanged.
- `LatestReviewsSection.tsx` passes both through; `CoursesBrowsePage.tsx` runs the read and
  adds `authorRounds.settled` to the `latestReviews` GateReport. `src/lib/batches.ts` (new)
  is the shared fixed-size batcher.

## Tests
- New `src/test/coursesMembersSections.test.tsx`: 23 cases (copy rules incl. 1st–23rd
  ordinals and signed figures; pill show/hide, rank-1 wording, under-par red, other-hole
  rank, ranks error; strip singular/null best/own review/absent row/no-props caller; both
  gates holding then opening, and no read for an empty pool).
- Harness only (no assertion changed): QueryClientProvider added to
  `coursesWholePageHold.test.tsx`, `coursesBrowseHighestRatedRemoval.test.tsx`,
  `coursesPhotoTopScrims.test.tsx` — the page and the rail now own a real read, so those
  mounts needed a client.
- Two assertions in `src/test/latestHolesSection.test.tsx` narrowed, both encoding "the tap
  performs no network read": `expect(f.holeRpc).not.toHaveBeenCalled()` became a
  before/after call-count comparison in
  "a tap opens the canonical viewer readOnly on the tapped shot across the whole rail" and
  "a tap opens immediately with no network wait", because the pill read itself fires on
  mount. No test deleted, renamed or rewritten.

## Counts
Baseline 8,858 → 8,881. Shards: 2,255 / 2,162 / 2,222 / 2,242 = 8,881
(= 8,858 + the 23 new cases; shard 2 and 4 shifted because the new file joins the run).
No failures; no known intermittent or pre-existing failure appeared.

## Render check (320px, live data)
document.scrollWidth 320 (no page overflow); 4 pills, all inside their tiles with no
truncation (e.g. "Plays +0.49 · 13th hardest hole"); 32 strips, no card overrun; at 1280
docScroll 1280, 0 overruns. Signed-out viewer reads THEIR BEST on every strip.

## Not done
No SQL, no migrations, no RPC/edge edits, feed_config untouched, round_pool_cap 30.

---

## BRIEF_MEMBER_SCORE_SECTIONS_CLOSEOUT — 15 Nov 2026

### Section A — Plays pill sample gates (REPORT-AND-STOP on the permanent fix)
`get_course_hole_ranks`, read from `pg_get_functiondef`:
1. Minimum plays behind a hole's rank — **no gate** at hole level. The only floor is
   course-wide: `where p.total_rounds >= 20`, where `pooled` counts
   `count(distinct ws.id)` of cards with `wsh.played = true and wsh.actual_gross is not
   null`. One played hole inside a course holding 20 cards is still ranked.
2. Distinct players — **no gate**, and none is possible: `whs_scores` has no member
   column (`connection_id`, `whs_score_uid`, `marker_name` are the only identity-ish
   columns), so `count(distinct ws.id)` counts score cards, not people.
3. Floor on the to-par figure — **no gate**: `avg_to_par` is used only for ordering
   (`order by h.avg_to_par desc`).

Live distribution, read from the whole eligible rail (`course_rank <= 2`, the set
paging can show), not estimated: **4 pills — 0 at 1-2 plays, 0 at 3-9, 4 at 10+**
(761, 774, 869, 876 plays). Distinct players behind each: unavailable, no member
identity exists on the play rows; distinct `connection_id` = 23 for all four.
STOP: a hole-level floor is a server change and this turn carries none.

Interim behaviour shipped: `src/components/courses/browse/holePlays.ts:45-50`
(`RANK_ORDINAL_MIN_PLAYS = 10`, `rankIsOrdinable`) and its two uses in
`src/components/courses/browse/LatestHolesSection.tsx:83-84` (aria-label) and `:106`
(the visible ordinal clause). No tile is hidden; no server floor is loosened.

### Section B — rounding, sign, the word for zero
`playsFigure` (`holePlays.ts:56-58`) now delegates to the canonical Courses to-par
value (`src/components/courses/browse/format.ts:11-15`): `Math.round(v * 10) / 10`
FIRST, then the sign, ONE decimal, U+2212, and `'level'` when the rounded value is
zero — so a hole rounding to par reads "Plays level", never "+0.0" or "−0.0".
`playsIsUnderPar` (`holePlays.ts:72`) follows the printed figure, so a value that
reads level is never red.
REPORT only: the stat chip's negatives use an **ASCII hyphen** —
`src/components/courses/useStatBrowse.ts:474` `-${Math.abs(v).toFixed(1)}` — while the
pill uses U+2212. They disagree; not changed here.

### Section C — Lowest rounds at an empty scope
The branch that decides it is `src/components/courses/StatBrowse.tsx:809-811`
(`showEmpty && areaHasTracked && lens !== 'played'`), which renders the lens-named
panel (heading `:817`) with the filled INK switch button (`:843-852`) and no Connect
button. The amber "No rounds logged" invitation (`:865-900`) renders only when the
area has no tracked courses at all, where the claim is true.
`lowest` is **not** absent from `lens_counts` — `get_stat_browse_facets` builds
`'lowest', COUNT(*) FILTER (WHERE b.course_record IS NOT NULL)` in all three count
objects — so no absence comment was added. Entry bar: `get_stat_browse_courses`'
`lowest` arm is `s.course_record IS NOT NULL` (a course with no record cannot be
ranked by record) with `ORDER BY ... course_record ASC NULLS LAST`; nothing rules a
member out.

### Section D — test integrity
Both narrowed assertions are STRICT EQUALITY of the call count:
`src/test/latestHolesSection.test.tsx:126-129` and `:151-155`, each
`const before = f.holeRpc.mock.calls.length;` … `expect(f.holeRpc.mock.calls.length).toBe(before);`
Added to each: `expect(before).toBeGreaterThan(0)` at `:126` and `:151`, so removing
the pill read outright now fails instead of passing on a zero baseline. Both pass —
the mount read has already fired before the tap.
The moved anchor: `src/test/coursesListPhotoCards.test.tsx` renders the REAL
`StatBrowse` (`:68`) with only its data hooks mocked, so `#courses-all` is genuinely
covered — `head()` at `:91` resolves it and the head tests at `:114`, `:131`, `:143`
fail if it disappears. No stub, no orphaned coverage.

### Section E — render checks
320 / 375 / 430 on `/courses`, both boards: page scrollWidth equals the viewport at
every width (documentElement, `#root` and body all 320 / 375 / 430); no list card
overruns the viewport at any width; the scope head and the Lowest rounds board render
10 full-width cards with no empty panel.
One truncated line at every width: the card's course name
(`src/components/courses/BrowseCourseCard.tsx:178-182`, `whiteSpace: 'nowrap'` +
ellipsis at 22px) clips — "Trump International Golf Links" 417>288 at 320,
"Sundridge Park Golf Club (West Course)" 414>288. Rail items reporting right edges
past the viewport (618 in a 320 viewport) are horizontal rails, not page overflow.
Signed-in Latest holes check NOT run: the backend is `external_unmanaged`, so Lovable
cannot mint a session and no credentials were requested. "YOUR BEST" therefore
remains covered only by `src/test/coursesMembersSections.test.tsx:319`
(`expect(stripOf(view.container, 0).textContent).toBe('4ROUNDS HERE78+6YOUR BEST')`).

### Section F — suite and commits
8,899 tests = shards **2268 / 2174 / 2229 / 2228**. Delta against 8,896: **+3**, all
three new pill cases in `src/test/coursesMembersSections.test.tsx` (`:251`, `:263`,
`:271`). One test renamed and rewritten, because this brief changes the precision rule
it encodes: "signs the average exactly as the mock prints it" → "rounds the average
first, then signs it, at the stat chip's one decimal" (`:143`), asserting
`playsFigure(0.42) === '+0.4'`, `playsFigure(-0.16) === '−0.2'`, `playsFigure(2) ===
'+2.0'` and the round-to-par cases. Two existing pill assertions updated for one
decimal (`:213-214`, `:245-248`). No test deleted, and no test in another file touched.
Commits: report 2's work `c24bc64a38`; this closeout `8771d99b96`.
