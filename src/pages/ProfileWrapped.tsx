import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  // No need to set variant anymore - it's locked to glass-dark
  return <ProfilePage />;
};

export default ProfileWrapped;