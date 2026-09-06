import MapPinIcon from '@/components/icons/MapPinIcon';
import HouseIcon from '@/components/icons/HouseIcon';
import LeaderboardMarkIcon from '@/components/icons/LeaderboardMarkIcon';
import PlusSquareIcon from '@/components/icons/PlusSquareIcon';
import TrophyIcon from '@/components/icons/TrophyIcon';

// NOTE: tab IDs are historical and do NOT match labels.
//   id 'clubhouse' = the immersive swipe FEED at '/'   (label "Explore")
//   id 'watch'     = NOW the Discover surface at '/explore' (label "Discover").
//                    The standalone Watch hub is dormant behind WATCH_SURFACE.
//                    The id stays 'watch' on purpose - scroll-to-top logic and
//                    analytics key off it.
// Change labels/icons freely; do NOT rename IDs (scroll-to-top logic + analytics depend on them).
// THE NAV ICON SET IS FILLED, NOT STROKED. Any new icon is a filled path matched
// optically to the existing marks.

export const navigationTabs = [
  { id: 'clubhouse', label: 'Home',      icon: HouseIcon,  path: '/' },
  { id: 'watch',     label: 'Amateur',   icon: LeaderboardMarkIcon, path: '/explore' },
  { id: 'post',      label: 'Post',      icon: PlusSquareIcon, path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: MapPinIcon, path: '/courses' },
  { id: 'tourhub',   label: 'Tour',      icon: TrophyIcon, path: '/tourhub' },
];

// Per-tab optical size map (expanded). Keyed by the REAL tab ids above.
// The labelled bar uses a shared 23px optical box across all five marks.
export const ICON_SIZE: Record<string, number> = {
  clubhouse: 23,
  watch: 23,
  post: 23,
  courses: 23,
  tourhub: 23,
};

// Uniform icon-box (tap target / centering). Sized to the largest glyph.
export const ICON_BOX = 23;
