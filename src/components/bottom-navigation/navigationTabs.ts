
import { IoCompassOutline } from 'react-icons/io5';
import { 
  HomeIcon,
  CameraIcon, 
  MapPinIcon, 
  Squares2X2Icon, // Hub icon
  TrophyIcon // Tour Hub icon
} from '@heroicons/react/24/outline';

// Base tabs (always visible)
const baseTabs = [
  { id: 'clubhouse', label: 'Home', icon: HomeIcon, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: IoCompassOutline, path: '/discover?main=shorts' },
  { id: 'tourhub', label: 'Tours', icon: TrophyIcon, path: '/tourhub' },
  { id: 'post', label: 'Moment', icon: CameraIcon, path: null, isAction: true },
  { id: 'courses', label: 'Courses', icon: MapPinIcon, path: '/courses' },
];

// Hub tab - always enabled
const hubTab = { id: 'hub', label: 'Hub', icon: Squares2X2Icon, path: '/hub' };

export const navigationTabs = [...baseTabs, hubTab];
