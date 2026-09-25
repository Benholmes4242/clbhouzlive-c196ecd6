# Explore clap weight and scroll-to-top

## Changes
- Adjust the supplied clap artwork’s rendered weight so it visually matches the existing message icon at every shared size, without changing its shape or reaction behavior.
- Mount the existing bottom-right scroll-to-top control on the current Explore page so it remains available across All, Scores, Courses, and Watch views.
- Keep the Courses page behavior unchanged and reuse the same control rather than creating a duplicate.

## Verification
- Check the Explore page at the current phone viewport, including a scrolled state and multiple Explore views.
- Confirm the control returns the `#root` page scroller to the top and stays below fullscreen surfaces.
- Run focused checks and confirm the preview build is clean.
