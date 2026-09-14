# Scorecard sheet subject, labels, and simplification

## Confirmed findings

- The `AT THIS COURSE` data belongs to the **round owner**, not the signed-in viewer. The deployed `get_round_course_context(score_id)` first resolves the score to its `user_id` and `course_id`, then compares only that user's 18-hole rounds on that exact course.
- For Richard Lawrence's 13 September 2026 East Course round (`86`, par `71`), the deployed values are:
  - `rounds_here = 53`: Richard's rounds at this course, including this round.
  - `rank_here = 50`: this round is 50th among Richard's 53 rounds there.
  - `avg_to_par_others = +7.3`: Richard's average across his other 52 rounds there. The round was +15, producing the displayed `+7.7` difference.
  - `handicap_index_at_time = 2.7`: Richard's index recorded on this score, not Ben's and not Richard's current index.
- The existing Explore `avg_gross_here` field is also owner-scoped, assembled from the surfaced player's own history, but it does not feed this sheet. The sheet uses the deployed context RPC above.
- The incorrect second-person wording is therefore copy/UI logic, not incorrect data.
- `Sundridge Park-East Course` comes directly from the WHS-side `whs_courses.name` returned by `fetchRoundDetail`; it is not built in the client. That WHS row maps to canonical `golf_courses` row `f963823f-36f3-470c-b6b9-8d0ad0e130df`, whose name is `Sundridge Park Golf Club (East Course)`, region `Kent`, sub-country `England`, and grouping country `Britain & Ireland`.

## Build

1. **Make ownership explicit once**
   - Resolve one `isOwnRound` flag in the member wrapper and pass it into the shared sheet.
   - Keep the owner-scoped RPC, score-id key, query behavior, field gate, analytics, and all existing entry points unchanged.
   - Use one set of templates with an ownership variable: second person only for the viewing member's own round; otherwise use the player's name/third person.

2. **Use canonical course identity in the member sheet**
   - After the existing WHS-to-course mapping resolves, read that canonical `golf_courses` row for `name`, `region`, `sub_country`, and `country`.
   - Prefer the canonical name and build the place through the existing shared course-place formatter: region + sub-country, with its established fallback only when region is absent.
   - Retain the raw WHS name/country as a loading or unmapped fallback so opening the sheet never regresses.
   - Leave the shared tour scorecard's tournament/venue header behavior unchanged.

3. **Rebuild the member header into four elements**
   - Left: canonical course name with canonical place beneath.
   - Right: gross as the main figure, then one quiet line containing to-par and par.
   - Below: avatar, player name, and date as one identity row; retain the nine-hole marker with the date when applicable.
   - Move like/comment out of the header. Keep own-member amber identity behavior and all score-color rules.

4. **Flatten member sections**
   - Replace bordered/rounded member panels with unframed sections separated by spacing and existing uppercase kickers.
   - Keep the 18-hole card and scoring key, the course-history block, and the round-breakdown bar/counts.
   - Remove the trajectory and the `HOW IT UNFOLDED` section entirely from the member sheet.
   - Preserve shared tour behavior where this member brief does not apply.

5. **Clarify the course-history stats**
   - Centre up to three equal-width stats across the available width.
   - Render rank as `50th` over `of 53 rounds`.
   - Render the self-comparison as `+7.7` over `vs their average`, switching only to `vs your average` for the owner viewing their own round.
   - Render `2.7` over `HCP at the time`.
   - Keep comments beside the derivation making explicit that this average is the player's own other rounds at the course.

6. **Keep the field fact without the chart**
   - Place one subject-aware sentence beneath the three stats when the existing five-player field gate and hole-data gate pass.
   - Use `You beat the field average…` only for an own round; use `{Name} beat the field average…` otherwise.
   - Keep `field` literal in every locale and document that this is the all-other-player comparison, distinct from the player's self-average above.
   - Preserve the existing strict comparison (`strokes < field average`) and actual field-data denominator rather than inventing 18 where fewer holes have data.

7. **Move actions to the foot**
   - Put comment and like with the existing profile, course, and own-round share actions at the bottom.
   - Preserve the established controls, counts, optimistic behavior, and absent-comment behavior; only their placement changes.

8. **Six locales and cleanup**
   - Update `en`, `de`, `es`, `ja`, `ko`, and `en-XA` for the owner/third-person course heading, `of n rounds`, `vs your/their average`, `HCP at the time`, and subject-aware field sentence.
   - Retire scorecard-only keys made unused by removing `HOW IT UNFOLDED` and the old ambiguous labels, after confirming no remaining readers.
   - Keep golf terms and generated proper nouns unchanged.

## Verification

- Add focused tests for own-round and other-member copy, including Richard's `50th / of 53 rounds / +7.7 / vs their average / 2.7 / HCP at the time` case.
- Verify the canonical East Course name and `Kent, England` fallback behavior.
- Verify the field sentence remains gated, uses strict “beat,” and never loses the word `field`.
- Verify no member section has panel borders/radii, no trajectory remains, and engagement actions appear only at the foot.
- Exercise the sheet from representative own-round and circle-round entry points.
- At mobile widths, verify centred stat geometry, wrapping, no horizontal overflow, finger scrolling, grabber dismissal, backdrop dismissal, and browser back dismissal.
- Run locale JSON validation, focused tests, the project build, and diff whitespace checks.

## Contradictions and limits

- The current component comments say the course-history subject machinery was intentionally removed because the facts became figures; this brief supersedes that decision and requires subject-aware copy again.
- The current score header intentionally stacks to-par and par as separate lines; this brief supersedes it with one combined quiet line.
- The existing field sentence is inside the trajectory panel and uses second person unconditionally; removing the chart requires relocating and subjecting that sentence.
- The supplied example says “on n of 18 holes,” but current behavior honestly uses the number of holes carrying field data. The implementation will preserve that denominator unless all 18 are available, avoiding a false claim.
- One legacy messaging entry point opens the viewer's own score without passing a profile user id. It must explicitly resolve the viewer as owner so the new subject rules and identity row remain correct; other round-card paths already carry an owner.
- No SQL change is needed. Authenticated touch/runtime verification may remain limited because this project uses external unmanaged Supabase authentication; source, build, unit, and anonymous shell checks will still run.
