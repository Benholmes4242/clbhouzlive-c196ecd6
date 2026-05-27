import { IoCompassOutline } from 'react-icons/io5';
import {
  CameraIcon,
  MapPinIcon,
  PlayCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Watch',     icon: PlayCircleIcon,   path: '/clubhouse' },
  { id: 'watch',     label: 'Clubhouse', icon: IoCompassOutline, path: '/watch' },
  { id: 'post',      label: 'Share',     icon: CameraIcon,       path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: MapPinIcon,       path: '/courses' },
  { id: 'tourhub',   label: 'Tour',      icon: TrophyIcon,       path: '/' },
];
