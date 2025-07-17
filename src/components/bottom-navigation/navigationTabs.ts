
import { BsHouseFill } from 'react-icons/bs';
import { GiTrophy } from 'react-icons/gi';
import { FaUser, FaGolfBallTee } from 'react-icons/fa6';
import { Camera } from 'lucide-react';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: BsHouseFill, path: '/clubhouse' },
  { id: 'tour', label: 'Tour Central', icon: GiTrophy, path: '/tour-central' },
  { id: 'post', label: 'Post', icon: Camera, path: null, isAction: true },
  { id: 'profile', label: 'Profile', icon: FaUser, path: '/profile' },
  { id: 'courses', label: 'Courses', icon: FaGolfBallTee, path: '/courses' },
];
