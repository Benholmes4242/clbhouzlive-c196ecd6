import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePage from './ProfilePage';

const ProfileWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Profile pages use glass-dark variant for the special effect
    setVariant('glass-dark');
  }, [setVariant]);

  return <ProfilePage />;
};

export default ProfileWrapped;