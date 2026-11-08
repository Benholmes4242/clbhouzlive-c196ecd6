/**
 * THE 350px PHOTO HERO RULE. Every photographic hero is 350px tall in total,
 * measured from the top of the screen with the notch counted INSIDE it — the
 * way the tour overview always counted it. Never add var(--sat) or
 * env(safe-area-inset-top) on top; heroes that must clear the notch pad their
 * content, not their height. Text stays bottom-anchored; images stay cover.
 */
export const HERO_PHOTO_HEIGHT = 350;

/** Shared fixed height for Explore, course-detail, and Courses photographic heroes. */
export const EXPLORE_COURSE_HERO_HEIGHT = HERO_PHOTO_HEIGHT;
