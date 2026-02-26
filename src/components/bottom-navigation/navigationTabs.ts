
import { IoCompassOutline } from 'react-icons/io5';
import { 
  HomeIcon,
  CameraIcon, 
  MapPinIcon, 
  TrophyIcon // Tour Hub icon
} from '@heroicons/react/24/outline';

// Navigation tabs (5 tabs: Home, Discover, Moment, Tours, Courses)
export const navigationTabs = [
  { id: 'clubhouse', label: 'Home', icon: HomeIcon, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: IoCompassOutline, path: '/discover?main=shorts' },
  { id: 'post', label: 'Moment', icon: CameraIcon, path: null, isAction: true },
  { id: 'tourhub', label: 'Tours', icon: TrophyIcon, path: '/tourhub' },
  { id: 'courses', label: 'Courses', icon: MapPinIcon, path: '/courses' },
];
