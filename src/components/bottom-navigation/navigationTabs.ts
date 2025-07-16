
import { Search, Camera, Trophy, MapPin, House } from 'lucide-react';

export const navigationTabs = [
  { id: 'clubhouse', label: 'Clubhouse', icon: House, path: '/clubhouse' },
  { id: 'explore', label: 'Explore', icon: Search, path: '/explore' },
  { id: 'post', label: 'Post', icon: Camera, path: null, isAction: true },
  { id: 'tour', label: 'Tour Central', icon: Trophy, path: '/tour-central' },
  { id: 'courses', label: 'Courses', icon: MapPin, path: '/courses' },
];
