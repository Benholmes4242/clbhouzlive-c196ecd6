/**
 * The glass chip for anything that sits on a course photograph on the Courses
 * page and Discover's "Who's been playing" rail. Lifted VERBATIM from
 * FriendsPlayedRail (BRIEF_COURSES_PAGE_REBUILD §1b).
 *
 * The flat base is the base; the blur is the enhancement. backdrop-filter
 * no-ops on older webviews, and a transparent chip over a photograph is
 * unreadable, so never drop the flat rule.
 *
 * `.glass-chip` is the Courses page class; `.fpg-chip` / `.fpg-score` are the
 * Discover rail's original class names, kept so that rail renders unchanged.
 */
export const GLASS_CHIP_CLASS = 'glass-chip';

export const GLASS_CHIP_CSS = `
.glass-chip, .fpg-chip, .fpg-score { background: rgba(24,30,26,0.62); border: 1px solid rgba(255,255,255,0.28); }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-chip, .fpg-chip, .fpg-score {
    background: rgba(24,30,26,0.40);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    backdrop-filter: blur(16px) saturate(180%);
  }
}
`;
