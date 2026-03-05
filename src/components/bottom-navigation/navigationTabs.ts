
import { IoCompassOutline } from 'react-icons/io5';
import { 
  HomeIcon,
  CameraIcon, 
  MapPinIcon, 
  TrophyIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

// Navigation tabs (6 tabs: Home, Discover, Moment, Tours, Courses, Watch)
export const navigationTabs = [
  { id: 'clubhouse', label: 'Home', icon: HomeIcon, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: IoCompassOutline, path: '/discover?main=shorts' },
  { id: 'post', label: 'Moment', icon: CameraIcon, path: null, isAction: true },
  { id: 'tours', label: 'Tours', icon: TrophyIcon, path: '/tours' },
  { id: 'courses', label: 'Courses', icon: MapPinIcon, path: '/courses' },
  { id: 'watch', label: 'Watch', icon: PlayIcon, path: '/watch' },
];
