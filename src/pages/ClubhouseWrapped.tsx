import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useBottomNavigationVariant } from '@/hooks/useBottomNavigationVariant';
import Clubhouse from './Clubhouse';

const ClubhouseWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  // Set bottom navigation variant for clubhouse
  useBottomNavigationVariant('clubhouse');

  return <Clubhouse />;
};

export default ClubhouseWrapped;