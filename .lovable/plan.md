# Explore round cards: C3 stat strip amendment

## Goal
Replace the current round-card photo NET/HCP chips and full-width achievement panel with the amended C3 strip beneath the photograph. Review cards, headlines, kickers, who-lines, traces, and round-sheet behavior remain unchanged. No SQL changes are needed.

## Changes

### 1. Build the amended round stat strip
- Render the strip only on non-paired round cards, between the photograph and caption.
- Cell order: optional achievement, `PAR`, `NET`, `VS HCP`.
- `PAR` uses `facts.course_par` and always has a white value.
- `NET` uses `facts.net`; color it with the canonical `TOPAR_UNDER_DARK` token only when net is below course par.
- `VS HCP` is `net - course_par`, formatted as true-minus `−1`, `+3`, or `Level`; color only negative values with `TOPAR_UNDER_DARK`.
- Keep the established strip styling and dividers. With an achievement, use `1.6fr 0.8fr 0.8fr 0.8fr`; without one, use three equal columns.
- Remove NET and HCP from the photograph. Gross and gross-to-par remain the sole photo chip.

### 2. Apply the amended missing-data rules
- Treat the net figures as available only when both `facts.net` and `facts.course_handicap` are non-null.
- Never show `PAR` by itself.
- If net figures are unavailable and an achievement exists, render one full-width achievement cell.
- If net figures are unavailable and no achievement exists, render no strip.

### 3. Narrow achievement eligibility and priority
- Use exactly: gross record, net record, rank up, ace, albatross, eagle, 5+ birdies, bogey-free.
- Keep backlog suppression for gross/net records and rank-up.
- Keep the existing crown, NET star, up arrow, star, red birdie-count circle, and shield icon treatments.
- Use the requested titles, including `Up to {ordinal}` / `Moved up`.
- Remove handicap cut and beat-handicap from round-card achievement selection; `VS HCP` becomes the only beat-handicap signal.
- Preserve the existing one-achievement-per-card rule.

### 4. Copy and tests
- Add or update the strip labels and amended rank-up wording across the six locale files, preserving pseudo-locale behavior.
- Replace obsolete photo-chip, beat-handicap, handicap-cut, and birdie-stat assertions with tests for:
  - exact cell order;
  - no `BIRDIES` figure-cell label;
  - both missing-net states;
  - birdies achievement priority below eagle and above bogey-free;
  - `PAR` never appearing without net;
  - true-minus, plus, `Level`, and red/white figure rules;
  - both grid-width modes.
- Run the focused Explore tests and the project’s standard test command; verify the rendered strip at 320px and the normal mobile viewport without overflow or layout shift.

## Existing-code contradiction resolved by this amendment
The current working tree still implements C4 NET/HCP photo chips and allows beat-handicap/handicap-cut callouts. This amendment supersedes those client behaviors: the gross chip stays on the photo, while net context moves exclusively into the C3 strip and those two callouts are disabled.
