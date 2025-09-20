import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useHeaderVariantSetter } from '@/hooks/useHeaderVariant';
import { useBottomNavigationVariant } from '@/hooks/useBottomNavigationVariant';
import Discover from './Discover';

const DiscoverWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  // Set header and bottom navigation variants for discover
  useHeaderVariantSetter('solid-light');
  useBottomNavigationVariant('default');

  return <Discover />;
};

export default DiscoverWrapped;