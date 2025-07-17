
import { BsHouseFill } from 'react-icons/bs';
import { GiTrophy } from 'react-icons/gi';
import { FaUser, FaGolfBallTee, FaCompass } from 'react-icons/fa6';
import { HiCamera } from 'react-icons/hi2';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: BsHouseFill, path: '/clubhouse' },
  { id: 'discover', label: 'Discover', icon: FaCompass, path: '/discover' },
  { id: 'tour', label: 'Tour Central', icon: GiTrophy, path: '/tour-central' },
  { id: 'post', label: 'Post', icon: HiCamera, path: null, isAction: true },
  { id: 'profile', label: 'Profile', icon: FaUser, path: '/profile' },
  { id: 'courses', label: 'Courses', icon: FaGolfBallTee, path: '/courses' },
];
