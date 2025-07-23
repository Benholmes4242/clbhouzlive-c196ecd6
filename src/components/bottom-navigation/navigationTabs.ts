
import { 
  BoltIcon,
  TrophyIcon, 
  CameraIcon, 
  MapPinIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { HomeIcon } from '@heroicons/react/24/solid';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: HomeIcon, path: '/clubhouse' },
  { id: 'discover', label: 'Explore', icon: BoltIcon, path: '/discover' },
  { id: 'tour', label: 'Tour Central', icon: TrophyIcon, path: '/tour-central' },
  { id: 'post', label: 'Post', icon: CameraIcon, path: null, isAction: true },
  { id: 'courses', label: 'Courses', icon: MapPinIcon, path: '/courses' },
  { id: 'profile', label: 'Profile', icon: UserIcon, path: '/profile' },
];
