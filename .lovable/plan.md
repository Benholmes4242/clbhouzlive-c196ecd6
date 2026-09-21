# Stop the Tour Overview results hero truncating itself

## Scope
- Remove the results-only champion block and `champion` prop from `PhotoBand`, leaving the photograph’s state chip, tour label, title, and venue/date line unchanged.
- Keep the existing champion derivation in `HybridHero` and render the existing `ChampionStrip` directly below `PhotoBand` only when a completed result has a champion.
- Build the strip score with the existing `fmtScore` and existing playoff/winning-margin translation keys; pass the resolved winner avatar’s first candidate when a winner player is available, otherwise use the strip’s existing placeholder. Leave rounds, par, and narrative absent.
- Do not mount `MiddleBand`, change `ChampionStrip`, add component files, or alter live/upcoming hero output.

## Prize column
- In the existing overview `MiniBoard`, compute the displayed slice first and show PRIZE only when every displayed row has a non-null money value.
- Add the requested maintenance comment explaining why completed events in the same tour and season may legitimately differ.
- Use the existing shared `formatEarnings` formatter for every shown figure.
- When PRIZE is absent, omit both header and cells so the flexible player-name column automatically reclaims its width.

## Verification
- Add focused tests for the completed-only champion strip, the unchanged live/upcoming states, score copy, and all-present versus partially-missing prize data.
- Verify Biltmore Championship Asheville / Jacob Bridgeman at 320px, 390px, and 430px, plus BMW PGA Championship / J.J. Spaun, checking rendered overflow rather than only screenshots.
- Verify one complete-prize board and one missing-prize board at 390px, including the player-name width difference.
- Run the focused Tour Overview tests and TypeScript checks.
- Report the requested reference-only audit for ChaserRow, LastYearRow, FieldStrengthStrip, CourseStatsStrip, HeroWireTicker, PlayoffPendingPanel, TrajectorySparkline, and CourseShapePanel without mounting or modifying them.
