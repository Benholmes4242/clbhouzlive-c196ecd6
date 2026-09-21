# Record margins

## Build
- Read current rank 1 and rank 2 gross-record rows together, preserving the existing ambiguity rejection for record holders.
- Carry the rank-2 value and positive record margin onto round stream facts; omit it when rank 2 is absent.
- Pass the existing `Consequence.delta` from `roundConsequence` into the rank-up callout, so headline and callout share one resolved movement value.
- Add pluralized record and movement sublines in the existing callout typography without changing tags, icons, labels, tiers, feat rarity, or `net_record`.

## Verify
- Add focused data-path and rendering regressions for record margin present/absent, singular/plural copy, shared rank movement, and unchanged net-record output.
- Run focused tests, TypeScript validation, and diff checks.
- Render 390px course-record cards with and without a runner-up, then inspect and provide the screenshot.

## Constraints
- No SQL, migrations, net-board work, new queries, or changes to event achievement margins.
