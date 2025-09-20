import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    // Profile pages have hero images, use glass-dark
    setVariant('glass-dark');
  }, [setVariant]);

  return <ProfilePage />;
};

export default ProfileWrapped;