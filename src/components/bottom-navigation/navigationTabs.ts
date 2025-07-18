
import { BsHouseFill } from 'react-icons/bs';
import { GiTrophy } from 'react-icons/gi';
import { FaUser } from 'react-icons/fa6';
import { PiGolfBold } from 'react-icons/pi';
import { HiCamera } from 'react-icons/hi2';
import { RiCompassDiscoverLine } from 'react-icons/ri';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: BsHouseFill, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: RiCompassDiscoverLine, path: '/discover' },
  { id: 'tour', label: 'Tour Central', icon: GiTrophy, path: '/tour-central' },
  { id: 'post', label: 'Post', icon: HiCamera, path: null, isAction: true },
  { id: 'courses', label: 'Courses', icon: PiGolfBold, path: '/courses' },
  { id: 'profile', label: 'Profile', icon: FaUser, path: '/profile' },
];
