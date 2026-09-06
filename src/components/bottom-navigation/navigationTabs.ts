import MapPinIcon from '@/components/icons/MapPinIcon';
import HouseIcon from '@/components/icons/HouseIcon';
import AmateurLaurelIcon from '@/components/icons/AmateurLaurelIcon';
import PlusSquareIcon from '@/components/icons/PlusSquareIcon';
import TrophyIcon from '@/components/icons/TrophyIcon';

// NOTE: tab IDs are historical and do NOT match labels.
//   id 'clubhouse' = the immersive swipe FEED at '/'   (label "Explore")
//   id 'watch'     = NOW the Discover surface at '/explore' (label "Discover").
//                    The standalone Watch hub is dormant behind WATCH_SURFACE.
//                    The id stays 'watch' on purpose - scroll-to-top logic and
//                    analytics key off it.
// Change labels/icons freely; do NOT rename IDs (scroll-to-top logic + analytics depend on them).

export const navigationTabs = [
  { id: 'clubhouse', label: 'Home',      icon: HouseIcon,  path: '/' },
  { id: 'watch',     label: 'Amateur',   icon: AmateurLaurelIcon, path: '/explore' },
  { id: 'post',      label: 'Post',      icon: PlusSquareIcon, path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: MapPinIcon, path: '/courses' },
  { id: 'tourhub',   label: 'Tour',      icon: TrophyIcon, path: '/tourhub' },
];

// Per-tab optical size map (expanded). Keyed by the REAL tab ids above.
// Rationale: PlusSquare carries corner ink and reads large (-1);
// Pulse line is thinner and reads small at 30, so hold 31; the MapPin teardrop
// reads small (+1); House/Trophy hold the 31px baseline.
export const ICON_SIZE: Record<string, number> = {
  clubhouse: 31,
  watch: 30,
  post: 29,
  courses: 32,
  tourhub: 31,
};

// Uniform icon-box (tap target / centering). Sized to the largest glyph.
export const ICON_BOX = 32;
