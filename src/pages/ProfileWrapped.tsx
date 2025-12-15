import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePageV2 from './ProfilePageV2';

const ProfileWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Profile now uses light theme
    setVariant('solid-light');
  }, [setVariant]);

  return <ProfilePageV2 />;
};

export default ProfileWrapped;