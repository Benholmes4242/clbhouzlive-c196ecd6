import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useBottomNavigationVariant } from '@/hooks/useBottomNavigationVariant';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    // Profile pages have hero images, use glass-dark
    setVariant('glass-dark');
  }, [setVariant]);

  // Set bottom navigation variant for profile
  useBottomNavigationVariant('default');

  return <ProfilePage />;
};

export default ProfileWrapped;