# Mirror the shared post footer

## Build
- Reorder the shared footer row to heart, comment, and share on the left, with the actor avatar and chevron pushed to the far right.
- Remove the superseded liked-by indentation and its now-unused geometry helper.
- Remove the small glyph from comment previews and align both text rows to the card's 20px left edge.
- Keep the existing conditional rendering so likes/comment combinations collapse without reserved gaps, and preserve the in-flight liker text in the same one-line box.

## Verification
- Update focused comment-preview coverage for the glyph-free treatment.
- Verify the shared footer source covers normal and review posts, all four content states, zero-count glyph behavior, and no content beneath the right-aligned actor.
