import { TrophyIcon } from '@heroicons/react/24/outline';
import MapPinIcon from '@/components/icons/MapPinIcon';
import HouseIcon from '@/components/icons/HouseIcon';
import VideoIcon from '@/components/icons/VideoIcon';
import PlusSquareIcon from '@/components/icons/PlusSquareIcon';

// NOTE: tab IDs are historical and do NOT match labels.
//   id 'clubhouse' = the immersive swipe FEED at '/'   (label "Explore")
//   id 'watch'     = the browse/library HUB at '/watch' (label "Watch")
// Change labels/icons freely; do NOT rename IDs (scroll-to-top logic + analytics depend on them).

export const navigationTabs = [
  { id: 'clubhouse', label: 'Home',      icon: HouseIcon,  path: '/' },
  { id: 'watch',     label: 'Watch',     icon: VideoIcon,  path: '/watch' },
  { id: 'post',      label: 'Share',     icon: PlusSquareIcon, path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: MapPinIcon, path: '/courses' },
  { id: 'tourhub',   label: 'Tour',      icon: TrophyIcon, path: '/tourhub' },
];
