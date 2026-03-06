
import { IoCompassOutline } from 'react-icons/io5';
import { Compass } from 'lucide-react';
import { 
  HomeIcon,
  CameraIcon, 
  MapPinIcon, 
  TrophyIcon,
} from '@heroicons/react/24/outline';

// Navigation tabs (6 tabs: Home, Discover, Moment, Tours, Courses, Explore [temp])
export const navigationTabs = [
  { id: 'clubhouse', label: 'Home', icon: HomeIcon, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: IoCompassOutline, path: '/discover' },
  { id: 'post', label: 'Moment', icon: CameraIcon, path: null, isAction: true },
  { id: 'tourhub', label: 'Tours', icon: TrophyIcon, path: '/tourhub' },
  { id: 'courses', label: 'Courses', icon: MapPinIcon, path: '/courses' },
  { id: 'explore-new', label: 'Explore', icon: Compass, path: '/explore-new' },
];
