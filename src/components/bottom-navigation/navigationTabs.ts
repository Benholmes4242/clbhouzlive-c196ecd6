import {
  HomeNavIcon,
  ExploreNavIcon,
  ShareNavIcon,
  CoursesNavIcon,
  TourNavIcon,
} from './navIcons';

// NOTE: tab IDs are historical and do NOT match labels.
//   id 'clubhouse' = the immersive swipe FEED at '/'   (label "Home")
//   id 'watch'     = the Explore destination, SERVED AT '/amateur' (label "Explore").
//                    KNOWN, DELIBERATE MISMATCH: the label says Explore, the path
//                    says /amateur, and '/explore' is a redirect shim pointing AT
//                    '/amateur'. Swapping them means repointing eighteen call sites
//                    for zero member-visible gain — members never see the path.
//                    Do NOT 'fix' this in passing; straighten it only if we have
//                    another reason to touch those routes.
//                    It absorbed Discover's boards, courses, news and media;
//                    '/explore' is a redirect shim to '/amateur' and the
//                    standalone Watch hub stays dormant behind WATCH_SURFACE.
//                    The id stays 'watch' on purpose - scroll-to-top logic and
//                    analytics key off it.
//   id 'post'      = the composer entry point (label "Share"). The composer
//                    asks "What are you sharing?" and offers a review OR a
//                    post, so the label names both; "Post" named only one.
// Change labels/icons freely; do NOT rename IDs (scroll-to-top logic + analytics depend on them).
// THE NAV ICON SET IS OUTLINE, NOT FILLED (BRIEF_ISLANDS_NAV): 24 viewBox,
// round caps and joins, stroke-only — see navIcons.tsx. The old filled set in
// src/components/icons/ stays for its other consumers.

export const navigationTabs = [
  { id: 'clubhouse', label: 'Home',      icon: HomeNavIcon,  path: '/' },
  { id: 'watch',     label: 'Explore',   icon: ExploreNavIcon, path: '/amateur' },
  { id: 'post',      label: 'Share',     icon: ShareNavIcon, path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: CoursesNavIcon, path: '/courses' },
  { id: 'tourhub',   label: 'Tour',      icon: TourNavIcon, path: '/tourhub' },

];
