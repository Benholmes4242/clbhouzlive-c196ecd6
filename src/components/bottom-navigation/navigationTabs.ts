import { IoCompassOutline } from 'react-icons/io5';
import {
  HomeIcon,
  CameraIcon,
  MapPinIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: IoCompassOutline, path: '/clubhouse' },
  { id: 'watch',     label: 'Watch',     icon: PlayCircleIcon,   path: '/watch' },
  { id: 'post',      label: 'Share',     icon: CameraIcon,       path: null, isAction: true },
  { id: 'courses',   label: 'Courses',   icon: MapPinIcon,       path: '/courses' },
  { id: 'home',      label: 'Home',      icon: HomeIcon,         path: '/' },
];
