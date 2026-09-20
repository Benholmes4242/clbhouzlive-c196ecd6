# Tournament contest rebuild

## Goal
Rebuild the tournament detail as one event story: the hero states the claim, dedicated contest and move modules prove it, and each numerical fact appears in only one figure treatment.

## Implementation

1. **Create the pure contest model**
   - Add `tournament-v2/data/tournamentContest.ts` with typed, deterministic derivation from `BoardEntry[]`, `TournamentMeta`, and `EventState`.
   - Derive leaders, positive margin, shared-lead state, the unverified four-shot contention count, holes left, top-ten pack gaps, lead form, and the eligible live/completed mover.
   - Use round-scoped `today` data, a six-hole live floor, final-round completion rules, position tie-breaking, and explicit zero-gap protection.
   - Add focused tests for single/shared/playoff leads, all-level packs, mover hiding, thresholds, and incomplete data.

2. **Reduce and rewrite the hero**
   - Keep the canonical 340px photograph, state chip, title, and club/location line.
   - Replace leader score/person/action treatments with one localized verdict and a unique FIELD / PURSE / PAR proof strip.
   - Resolve FIELD from leaderboard size, then tournament hole-analysis player count; omit unresolved cells and pass whether purse rendered to Event info.
   - Use one complete translation per verdict shape, including empty output when fewer than two required facts resolve.

3. **Add contest and move evidence modules**
   - Add `ContestSection.tsx` for live/completed events with data-selected figure or word form, localized qualifier/sub-line, and a bounded pack track.
   - Add `MoveSection.tsx` for the best eligible non-leader round, using canonical avatar and score colour treatment; self-hide under every specified exclusion.
   - Keep amber confined to the leader dot and use canonical green/neutral tokens for the remaining pack.

4. **Remove repeated facts from existing sections**
   - Tint only MiniBoard's first-place row with the existing leader wash while preserving all board columns and geometry.
   - Remove R4 from On the Course metadata and Tee Times heading while retaining the hero chip as the sole round statement.
   - Replace CourseSection's repeated hardest/easiest feature pair with one localized comparison sentence; label the all-hole distribution and notable-hole rows.
   - Keep the existing hole rows and sheet behavior otherwise unchanged. If no current or existing comparison data resolves, render no course sentence; no new historical data source is introduced.
   - Reduce empty Moments to one ruled action row; populated moments remain unchanged.
   - Limit Event info to dates, yardage, defending champion, TV, and purse only when the hero could not show purse.

5. **Recompose the page and localize**
   - Order live/upcoming content as Hero → Contest → Move → Board → On the Course → Tee Times → Course → Event info → Moments.
   - Preserve StorySection's current completed placement and all existing sheets/deep links.
   - Add every new sentence, plural, label, and accessibility string in en/de/es/ja/ko/en-XA; suppress forced caps and tracking for Japanese and Korean.

## Technical details
- The pure selector remains hook-free. Field-size fallback is presentation data because `total_players` comes from `useTournamentHoleAnalysis`, outside the selector's declared inputs.
- Reuse `formatPurse`, `fmtScore`, `getScoreColor`, `PlayerAvatar`, existing tournament tokens, and the current React Query cache.
- No SQL, migrations, schema changes, nested page scrolling, or deletion outside the explicitly replaced treatments.
- Preserve upcoming field/tee-time behavior, full-board and scorecard sheets, realtime updates, analytics, and completed StorySection.

## Verification
- Run the tournament selector tests and project typecheck.
- Verify the Biltmore live acceptance state, plus forced shared-lead, leader-as-mover, and all-level fixtures.
- Verify representative upcoming and completed tournaments, including absent-data self-hiding and StorySection retention.
- At 320px, 390px, and 430px confirm: no horizontal overflow; pack end dots stay inset; verdict is at most three lines; Full leaderboard, R4, venue, par, and yardage each appear once; no repeated figure treatment.
