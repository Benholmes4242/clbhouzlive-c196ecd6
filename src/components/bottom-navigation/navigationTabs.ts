
import { Home, Compass, Trophy, Flag, Camera } from 'lucide-react';
import { TabItem } from './types';

export const navigationTabs: TabItem[] = [
  { id: 'home', label: 'Clubhouse', icon: Home, path: '/' },
  { id: 'explore', label: 'Explore', icon: Compass, path: '/explore' },
  { id: 'share', label: 'Share', icon: Camera, path: null, isAction: true },
  { id: 'tour-central', label: 'Tour Central', icon: Trophy, path: '/tour-central' },
  { id: 'courses', label: 'Courses', icon: Flag, path: '/courses' },
];
