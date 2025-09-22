import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Profile pages now use light frosted glass
    setVariant('solid-light');
  }, [setVariant]);

  return <ProfilePage />;
};

export default ProfileWrapped;