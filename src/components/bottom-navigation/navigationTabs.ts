
import { IoCompassOutline } from 'react-icons/io5';
import { 
  HomeIcon,
  TrophyIcon, 
  CameraIcon, 
  MapPinIcon, 
  UserIcon,
  Squares2X2Icon // Hub icon
} from '@heroicons/react/24/outline';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Base tabs (always visible)
const baseTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: HomeIcon, path: '/clubhouse' },
  { id: 'discover', label: 'Explore', icon: IoCompassOutline, path: '/discover' },
  { id: 'tour', label: 'Tour Central', icon: TrophyIcon, path: '/tour-central' },
  { id: 'post', label: 'Post', icon: CameraIcon, path: null, isAction: true },
  { id: 'courses', label: 'Courses', icon: MapPinIcon, path: '/courses' },
];

// Conditional last tab based on Hub feature flag
const lastTab = FEATURE_FLAGS.HUB
  ? { id: 'hub', label: 'Hub', icon: Squares2X2Icon, path: '/hub' }
  : { id: 'profile', label: 'Profile', icon: UserIcon, path: '/profile' };

export const navigationTabs = [...baseTabs, lastTab];
