import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Profile pages use light liquid glass
    setVariant('solid-light');
  }, [setVariant]);

  return <ProfilePage />;
};

export default ProfileWrapped;