import {
  CameraIcon,
  MapPinIcon,
  PlayCircleIcon,
  Squares2X2Icon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

// NOTE: tab IDs are historical and do NOT match labels.
//   id 'clubhouse' = the immersive swipe FEED at '/'   (label "Watch")
//   id 'watch'     = the browse/library HUB at '/watch' (label "Clubhouse")
// Change labels/icons freely; do NOT rename IDs (scroll-to-top logic + analytics depend on them).

export const navigationTabs = [
  { id: 'clubhouse', label: 'Watch',     icon: PlayCircleIcon,   path: '/' },
  { id: 'watch',     label: 'Clubhouse', icon: Squares2X2Icon, path: '/watch' },
  { id: 'post',      label: 'Share',     icon: CameraIcon,       path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: MapPinIcon,       path: '/courses' },
  { id: 'tourhub',   label: 'Tour',      icon: TrophyIcon,       path: '/tourhub' },
];
