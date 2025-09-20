import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import Clubhouse from './Clubhouse';

const ClubhouseWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  return <Clubhouse />;
};

export default ClubhouseWrapped;