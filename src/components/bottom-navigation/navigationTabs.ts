
import { GrHome } from 'react-icons/gr';
import { GiTrophy } from 'react-icons/gi';
import { FaRegUser } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import { HiCamera } from 'react-icons/hi2';
import { RiCompassDiscoverLine } from 'react-icons/ri';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: GrHome, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: RiCompassDiscoverLine, path: '/discover' },
  { id: 'tour', label: 'Tour Central', icon: GiTrophy, path: '/tour-central' },
  { id: 'post', label: 'Post', icon: HiCamera, path: null, isAction: true },
  { id: 'courses', label: 'Courses', icon: FiMapPin, path: '/courses' },
  { id: 'profile', label: 'Profile', icon: FaRegUser, path: '/profile' },
];
