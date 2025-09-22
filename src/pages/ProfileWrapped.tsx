import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Profile pages have hero images, use glass-dark
    setVariant('glass-dark');
  }, [setVariant]);

  return <ProfilePage />;
};

export default ProfileWrapped;