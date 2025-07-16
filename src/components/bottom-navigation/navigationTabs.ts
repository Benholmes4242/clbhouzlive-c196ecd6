
import { Search, Camera, Trophy, MapPin } from 'lucide-react';

export const navigationTabs = [
  { id: 'explore', label: 'Explore', icon: Search, path: '/explore' },
  { id: 'post', label: 'Post', icon: Camera, path: null, isAction: true },
  { id: 'tour', label: 'Tour Central', icon: Trophy, path: '/tour-central' },
  { id: 'courses', label: 'Courses', icon: MapPin, path: '/courses' },
];
