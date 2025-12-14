import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ProfilePageV2 from './ProfilePageV2';

const ProfileWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Profile V2 uses dark theme
    setVariant('glass-dark');
  }, [setVariant]);

  return <ProfilePageV2 />;
};

export default ProfileWrapped;