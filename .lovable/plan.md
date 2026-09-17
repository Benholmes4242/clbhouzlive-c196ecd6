# Scorecard glass card — S1

## Callsite audit

`CardScorecardSheet` has two runtime wrappers:

1. `RoundDetailSheet` — the member scorecard wrapper. It renders `CardScorecardSheet` directly and is opened from 18 places:
   - Explore/discovery: `ExploreMagazine`, `CircleShelf`, `WeeklyClubShelf`, `ExploreTabContent`, `WireTicker`, and `AmateurPage`.
   - Course surfaces: `CourseYouTab` and `YourRoundsSheet`.
   - Profile/handicap: `HandicapPage`, `RecentRoundsCard`, `LastRoundSection`, `RecentlyPlayedFeed`, `RoundsThatCountSection`, `MilestoneDetail`, and `CountingStatDetail`.
   - Other member surfaces: `PostsTabContent` and messaging `SharedGroundStrip`.
   - Dedicated page: `RoundPage` at `/round/:whsScoreId`.
2. Tour Hub `leaderboard/ScorecardSheet` — this is a separate data wrapper, but it also renders the same `CardScorecardSheet`; both its empty-target and populated-target paths use it.

`RoundDetailSheet` is not its own visual scorecard. It resolves member data, actions, comments, and honours, then delegates the complete presentation to `CardScorecardSheet`.

### Built-state contradiction

The comments and S1 brief describe `/round` as supplying a full-height `sheetStyle` override, but the current `RoundPage` passes no `sheetStyle`. It therefore currently receives the same bottom-sheet presentation with an 85dvh ceiling. The presentation can still be separated cleanly: add an explicit page mode used only by `/round`, while all other member callers and the Tour Hub wrapper use the glass-card overlay.

## Implementation

### Separate page and overlay presentation

- Add an explicit presentation mode to the canonical scorecard.
- Keep `/round` mounted as a full-height page with no backdrop, floating-card geometry, or entrance scale.
- Convert every overlay caller, including Tour Hub, to the centred glass card.
- Keep the existing shared content/data/action implementation; do not fork the scorecard.

### Glass overlay and gestures

- Add a scorecard-specific overlay rather than changing shared `BottomSheet`, so other sheets and their detents remain untouched.
- Apply the specified viewport backdrop, 14px side insets, 82dvh ceiling, glass material, 24px radius, shadow, and entrance timing.
- Respect reduced motion with opacity only.
- Close on backdrop tap, Escape, or a clearly vertical downward card swipe.
- Preserve the existing 8px axis lock and horizontal paging callback. Card taps remain untouched, so like, comment, profile, course, and share controls stay interactive.
- Keep the neighbour preview one card-width away and translated by the same horizontal delta.

### Content structure

- Preserve the honours treatment unchanged as a fixed first zone.
- Keep the summary fixed below it.
- Keep one body scroller containing round selector/card, At This Course, and exits, with `min-height: 0` and contained vertical overflow.
- Remove all scorecard-owned detent props, extent markers, mid-peek values, and remeasurement/debug plumbing. Do not alter `BottomSheet` detent support.
- Keep the one-off swipe hint and keyboard paging controls.

### Remove the trajectory panel

- Remove `TrajectoryLine` and “How it unfolded” from `CardScorecardSheet` for member and tour modes.
- Keep `TrajectoryLine.tsx`: its other live importers are `FriendRoundRow` and `RoundShape`.
- Retire `courses:scorecard.howItUnfolded` only if the final six-locale search confirms no remaining reader.

### Glass-safe score marks

- Rework the dark eagle and double-bogey ring construction into transparent-gap concentric strokes.
- Preserve the existing score grammar, colours, dimensions, and all non-glass callers.
- Verify eagle and double bogey against bright and dark photographic backgrounds.

## Verification

- Capture 390×844 and 320px states for member and tour cards, with and without honours where the data allows.
- Measure rendered card heights against the 82dvh ceiling and report fixed/body/total dimensions.
- Verify bright and dark photograph backdrops, reduced motion, empty scorecard states, and no horizontal page overflow.
- Exercise backdrop, Escape, downward dismiss, all exits, comments/likes, and left/right round paging with neighbour preview.
- Verify `/round/:whsScoreId` remains full-height and does not render the overlay treatment.
- Run focused scorecard/gesture/mark tests, types, and the project build.
