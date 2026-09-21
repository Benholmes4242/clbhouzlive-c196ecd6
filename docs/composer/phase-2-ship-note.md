# Unified composer — Phase 2 ship note (the review path)

## THE ANALYTICS BOUNDARY — READ BEFORE COMPARING ANY FUNNEL

`review_step_viewed` and `review_step_completed` carry step indices, and those
indices CHANGE MEANING with this phase.

| index | before Phase 2 | from Phase 2 |
|-------|----------------|--------------|
| 0     | Score          | (not emitted) |
| 1     | Breakdown      | (not emitted) |
| 2     | Words          | Photos and a few words |
| 3     | —              | The rating: dial + breakdown |

Build completed: **2026-09-21 18:19 UTC**.
Deployed to production: **_paste the publish timestamp here on ship_**.

Any funnel that crosses that timestamp must be FILTERED to one side of it, not
aggregated. Mixed, it reads as a cliff at step 2 and a new step appearing from
nothing — neither is a regression. The old order lost 44% at the Words screen
with every mandatory field already filled; that screen is what moved.

## Dormant by design (not indifference)

`review_tee_selected` stays registered and will read zero from this date. No
screen asks for a tee any more: the brief's derivation from
`gam_round_stats.tee_marker` was withdrawn because that column is NULL on all
3,563 rows, so it would have written a guaranteed null without erroring.
`p_tee_label` is still threaded through `submit_course_review_v2`, so an edit
carries its published tee through untouched. A future reader must not take the
flat line as members being indifferent to tees — it is absence, not indifference.

## Not wired until Phase 3

Step 3's skip link ("Post without rating it") is deliberately absent: it needs
the post engine. There is no exit from step 3 that publishes without a rating
until Phase 3 lands.

## The invariant Phase 3 must not break

The media pipeline and the composer state are created ABOVE the step branches in
ReviewComposerV2, so moving between step 2 and step 3 remounts nothing. Back
from the dial restores the words and the attached files from live state; the
draft cannot carry media, it only counts it. Do not move those hooks into a step
block and do not key the step bodies.
