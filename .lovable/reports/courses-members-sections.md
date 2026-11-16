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


---

## BRIEF_LATEST_HOLES_OPTION_A + CLOSEOUT — 16 Nov 2026

### Committed Option A work
Option A was already committed as **63beb8ca0b**. Latest holes now shows the uppercase
amber hole-word kicker, the unchanged two-line course name, sentence-case
`Par 3 · 175 yards`, and the unchanged byline. The numeral, PAR/YDS block and entire
Plays pill are removed. Existing tile geometry, photographs, scrims and video duration
remain. The sole application ranks consumer was LatestHolesSection; its ranks read,
query key, batching, stale time and ranks readiness dependency were removed together
with holePlays. Generated RPC types are not a consumer.

ImmersiveFullscreenChrome removes the course-name/location/record block only from the
synthetic member-shot top bar, retaining the chevron and clbhouz rating chip. Its
bottom caption/title remains unchanged; ordinary real-post headers remain unchanged.

### Exact Option A inventory reconciliation
**8,899 − 16 + 4 = 8,887**, exact, not approximate. Historical passing shards were
**2,268 / 2,158 / 2,229 / 2,232**. This corrects the earlier approximate wording.
The 16 removals all belong to `src/test/coursesMembersSections.test.tsx`.
Each removed case and its original assertions are quoted below. The reason for every
removal is the explicitly authorised retirement of the Plays pill and its ranks read;
reviewer-strip tests remain.

- **rounds the average first, then signs it, at the stat chip\'s one decimal** — removed because the Plays pill/ranks read was retired.
```tsx
expect(playsFigure(0)).toBe('level');
expect(playsFigure(0.42)).toBe('+0.4');
expect(playsFigure(-0.16)).toBe('\u22120.2');
expect(playsFigure(2)).toBe('+2.0');
expect(playsFigure(0.004)).toBe('level');
expect(playsFigure(-0.004)).toBe('level');
expect(playsFigure(0.049)).toBe('level');
expect(playsFigure(0.06)).toBe('+0.1');
expect(playsFigure(-0.06)).toBe('\u22120.1');
```

- **names rank one outright and every other rank by ordinal** — removed because the Plays pill/ranks read was retired.
```tsx
expect(rankPhrase(1)).toBe('Hardest hole');
expect(rankPhrase(2)).toBe('2nd hardest hole');
expect(rankPhrase(3)).toBe('3rd hardest hole');
expect(rankPhrase(4)).toBe('4th hardest hole');
expect(rankPhrase(11)).toBe('11th hardest hole');
expect(rankPhrase(12)).toBe('12th hardest hole');
expect(rankPhrase(13)).toBe('13th hardest hole');
expect(rankPhrase(18)).toBe('18th hardest hole');
expect(rankPhrase(21)).toBe('21st hardest hole');
expect(rankPhrase(22)).toBe('22nd hardest hole');
expect(rankPhrase(23)).toBe('23rd hardest hole');
```

- **keys ranks by course AND hole and drops incomplete rows** — removed because the Plays pill/ranks read was retired.
```tsx
expect([...map.keys()]).toEqual(['course-a|4']);
expect(map.get(rankKey('course-a', 4))?.difficulty_rank).toBe(2);
expect(toRanksMap(undefined).size).toBe(0);
expect(toRanksMap('nope').size).toBe(0);
```

- **marks only the tile whose course and hole the RPC ranked** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect((view.container.querySelector('[data-hole-plays]') as HTMLElement).textContent) .toBe('Plays +0.4· 3rd hardest hole');
expect(view.container.querySelectorAll('button')[0].getAttribute('aria-label')) .toBe('Hole 4, Course course-a, plays +0.4, 3rd hardest hole');
```

- **leaves an unranked tile exactly as it was** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect(cards[1].querySelector('[data-hole-plays]')).toBeNull();
expect(cards[1].getAttribute('aria-label')).toBe('Hole 7, Course course-b');
expect(cards[2].getAttribute('aria-label')).toBe('Hole 11, Course course-c');
```

- **asks for exactly the courses on the rail, once** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_course_hole_ranks', { p_course_ids: ['course-a', 'course-b', 'course-c'] }));
expect(f.rpc.mock.calls.filter(call => call[0] === 'get_course_hole_ranks')).toHaveLength(1);
```

- **never marks a tile from a rank belonging to another hole** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(held(view.container)).toBeNull());
expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(0);
```

- **paints an under-par average in the red figure and names rank one outright** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect(figure.textContent).toBe('Plays \u22120.1');
expect(figure.style.color).toBe('rgb(226, 75, 63)');
expect((view.container.querySelector('[data-hole-plays]') as HTMLElement).textContent) .toBe('Plays \u22120.1· Hardest hole');
```

- **keeps the Plays figure and states no ordinal below ten plays** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect((view.container.querySelector('[data-hole-plays]') as HTMLElement).textContent).toBe('Plays +0.4');
expect(view.container.querySelector('[data-hole-plays] em')).toBeNull();
expect(view.container.querySelectorAll('button')[0].getAttribute('aria-label')) .toBe('Hole 4, Course course-a, plays +0.4');
expect(view.container.querySelectorAll('button')).toHaveLength(3);
```

- **states the ordinal at exactly ten plays** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect((view.container.querySelector('[data-hole-plays]') as HTMLElement).textContent) .toBe('Plays +0.4· 3rd hardest hole');
```

- **reads a hole that rounds to par as Plays level, in no colour** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect(figure.textContent).toBe('Plays level');
expect(figure.style.color).toBe('');
expect(view.container.textContent).not.toContain('0.0');
```

- **keeps an over-par figure under CSS control** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1));
expect((view.container.querySelector('[data-plays-figure]') as HTMLElement).style.color).toBe('');
```

- **settles the rail with no pills when the ranks read fails** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('button')).toHaveLength(3));
expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(0);
```

- **holds the rail while the ranks read is unresolved** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(view.container.querySelectorAll('button')).toHaveLength(3));
expect(held(view.container)).not.toBeNull();
expect((view.container.querySelector('section')?.parentElement as HTMLElement).style.display).toBe('none');
```

- **opens the rail once the ranks read has settled** — removed because the Plays pill/ranks read was retired.
```tsx
expect(held(view.container)).not.toBeNull();
await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('get_course_hole_ranks', { p_course_ids: ['course-a', 'course-b', 'course-c'] }));
await waitFor(() => expect(held(view.container)).toBeNull());
expect(view.container.querySelectorAll('button')).toHaveLength(3);
expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(1);
```

- **opens the rail with no pills when the ranks read fails** — removed because the Plays pill/ranks read was retired.
```tsx
await waitFor(() => expect(held(view.container)).toBeNull());
expect(view.container.querySelectorAll('button')).toHaveLength(3);
expect(view.container.querySelectorAll('[data-hole-plays]')).toHaveLength(0);
```

Four added cases in `src/test/latestHolesSection.test.tsx`:
- “the kicker reads the hole as a word, above the course name”
- “the par line sits between the course name and the byline, in sentence case”
- “the numeral, the PAR/YDS block and the Plays pill are all absent”
- “a long course name clamps to two lines and still leaves room for the par line and byline”
The former par-label case was rewritten as “the par line states par and yardage, and an
unscored hole states neither”; that rewrite adds no case. The two tap assertions were
restored to `expect(f.holeRpc).not.toHaveBeenCalled()` as authorised. QueryClient
providers in the three protected test files were retained.

### Unchanged name audit
The live rail prints `course_name` directly from `get_latest_hole_media`, the stored
long course name, not a client-shortened label. The viewer derives its shorter title
client-side: `shortCoursePart` in `src/lib/courseMedia/memberShotPosts.ts` calls
`shareCourseName`, strips trailing suffixes such as “Golf Club”, and preserves the
parenthetical variant. Thus “Sundridge Park Golf Club (East Course)” on the rail and
“Sundridge Park (East Course)” in the viewer are different presentations of the same
source, not two edited stored names. Neither source/presentation was changed.

### Closeout ordinal correction
`holeOrdinal` in `src/lib/courseMedia/holeWalk.ts` retains the exact word list for
holes 1–18. Its numeric fallback now uses st/nd/rd/th, with every 11–13 ending using
th, so the shared rail and fullscreen kicker agree. Added seven cases to the existing
`src/test/holeWalk.test.tsx`: six parameterised cases named “uses the correct English
ordinal for hole 19/21/22/23/27/111”, asserting respectively 19th/21st/22nd/23rd/27th/111th;
and “preserves all eighteen hole words and the teen suffix exceptions”, asserting the
full existing word list plus 112th/113th. No existing test was deleted, renamed or
rewritten in this closeout.

### 430px live render check
Public `/courses`, real live data, 430×1800 viewport: 20 loaded Latest holes tiles.
The longest loaded course name was **Royal County Down Golf Club (Championship)**.
Its name clamps to two lines; the par and byline remain visible. Tile height 293px,
bottom stack height 88.640625px. documentElement, body and #root scrollWidth were
all **430px**, matching the viewport: no horizontal page overflow. The rail was
scrolled to its actual longest-name tile and visually checked without bottom-nav
occlusion. No fixtures, guest minting or authentication bypass were used. 320/375
checks were already verified and were not rerun, as requested.

### Closeout verification and totals
Focused command: `npx vitest run src/test/holeWalk.test.tsx src/test/latestHolesSection.test.tsx src/test/latestHolesSwipeCaption.test.tsx --maxWorkers=2` — **62/62 passed**.
Four separate sequential commands:
- `npx vitest run --maxWorkers=2 --shard=1/4` — **2,268 passed**, 194 files.
- `npx vitest run --maxWorkers=2 --shard=2/4` — **2,158 passed**, 194 files.
- `npx vitest run --maxWorkers=2 --shard=3/4` — **2,229 passed**, 194 files.
- `npx vitest run --maxWorkers=2 --shard=4/4` — **2,239 passed**, 191 files.
**8,894 executed / 8,894 passed**, 773 files, zero failures/skips.
Delta: **8,887 + 7 = 8,894**, entirely the named ordinal cases above.
No pre-existing or intermittent failure appeared; no shard rerun was needed.
Preview harness: `build OK` at 2026-11-16T07:07:21Z.

`chipForLens` is unchanged: its test-only ASCII hyphen has no application caller.
No SQL, migration files, RPC/edge edits, feed_config edits or native configuration
changes. round_pool_cap remains 30. The report and ordinal correction are committed
together in the closeout commit (hash supplied in the closing reply).
