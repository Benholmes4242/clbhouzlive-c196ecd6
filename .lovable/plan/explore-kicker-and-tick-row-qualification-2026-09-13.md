# Explore kicker and tick-row qualification

## Result
Record cards will use the course name alone in the kicker, while every ring, ownership, shortlist, and backlog reason remains intact. Tick visuals will require enough off-par holes to read as a row, except for a deliberate ace override.

## Implementation
1. Update the shared kicker resolver so `COURSE RECORD · COURSE` becomes `COURSE`; preserve `YOUR ROUND`, `ON YOUR LIST`, club, geography, world, and month prefixes. Keep the now-unused localized course-record key in all six locale files rather than deleting it.
2. Add a pure off-par-hole count and `MIN_TICK_OFF_PAR = 3` to the existing treatment resolver. Ordinary eagle/double-or-worse candidates below three off-par holes fall through to bar or none.
3. Preserve ace-only ticks regardless of row count. Keep albatross subject to the three-hole row qualification, because its headline already states the event and the override is specifically justified by the unique hole-in-one mark.
4. Extend table-driven tests for category removal, every retained kicker family, thresholds 2/3/4, fall-through behavior, and the quiet-ace exception.
5. Verify the affected card at 390px, capture the ace treatment screenshot, and check no horizontal overflow or regression to other round-shape consumers.

## Measured basis and decision
- Real sample: latest 100 eighteen-hole `gam_round_stats` rows with at least nine usable played-hole rows.
- Off-par count: min 2, P25 7, median 9, P75 11, max 16; exact counts at 1/2/3/4 are 0/1/0/0.
- With shape span 3, thresholds 2, 3, and 4 each currently produce 2 shape / 78 ticks / 3 bar / 17 none in this sample. None is not dominant.
- Choose shape span 3 and tick off-par minimum 3. Three matches the minimum readable-row judgment without making `none` dominant; the sampled mixes tie because all extreme-hole candidates already have at least four off-par holes.

## Kicker audit
- `COURSE RECORD · COURSE` -> `COURSE`: event category, removed.
- `YOUR ROUND · COURSE`: ownership ring/reason, kept; only amber kicker.
- `ON YOUR LIST · COURSE`: shortlist ring/reason, kept.
- `AT YOUR CLUB · COURSE`: club ring, kept.
- `AROUND REGION · COURSE`: regional ring, kept.
- `AROUND COUNTRY · COURSE`: national ring, kept.
- `AROUND THE WORLD · COURSE`: world ring, kept.
- `FROM MONTH · COURSE`: age/backlog reason, kept.
- Plain round `COURSE` -> `COURSE`: unchanged.
- Non-round `REVIEW`, `NEWS`, `CLIP`, `LONGER WATCH`, `FROM THE COMMUNITY`, and `COURSE` forms are outside the round-card change and remain unchanged.
