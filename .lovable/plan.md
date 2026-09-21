# Explore news tiles aligned to Tour Overview

## Goal
Keep Explore news stories as rounded 340px photo tiles, but give them the Tour Overview story hierarchy: an editorial source label with age aligned right, followed by the headline and standfirst. Remove all member attribution from news tiles.

## Changes
- Add a story-only metadata row at the top of the Explore photo tile.
  - Left: the story source when supplied; otherwise “Amateur News”.
  - Right: the existing relative publication age.
- Keep the headline and standfirst over the lower photograph, matching the Tour Overview hero’s type hierarchy and spacing.
- Do not render the shared member/avatar line for stories.
- Preserve the Explore tile’s existing rounded corners, 340px height, image behavior, navigation, and treatment for reviews, rounds, clips, moments, courses, and pair cards.
- Add focused tests proving source/date separation, member removal, standfirst behavior, and unchanged non-story branches.

## Technical details
- Reuse the existing `storyTime` formatter and existing semantic photograph text tokens.
- Scope all new rendering conditions to `item.kind === 'story'` so review and other card layouts cannot drift.
- Verify the focused Explore suite, TypeScript, and a 390px rendered fixture against the supplied Tour Overview reference.
