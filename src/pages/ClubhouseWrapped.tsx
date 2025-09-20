import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useHeaderVariantSetter } from '@/hooks/useHeaderVariant';
import { useBottomNavigationVariant } from '@/hooks/useBottomNavigationVariant';
import Clubhouse from './Clubhouse';

const ClubhouseWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  // Set header and bottom navigation variants for clubhouse
  useHeaderVariantSetter('glass-dark');
  useBottomNavigationVariant('clubhouse');

  return <Clubhouse />;
};

export default ClubhouseWrapped;