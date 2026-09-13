# Explore round headline deduplication

## Build
- Rewrite every round headline so the kicker alone names the course and the who-line alone names the player/date.
- Keep only the event, score, gap, and standing consequence in headlines; use existing fetched consequence fields only.
- Update all six locale files with interpolated templates and no concatenation.

## Verify and report
- Add focused copy tests, including a long-name record card whose gap sentence survives the two-line clamp.
- Measure pair kicker legibility at 320px and 390px without changing pair behavior.
- Count catalogue names likely to truncate and separately identify multi-course names using catalogue structure rather than punctuation guesses.
- Run focused tests, typecheck, build, and report every before/after template.
