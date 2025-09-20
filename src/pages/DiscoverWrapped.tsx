import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useBottomNavigationVariant } from '@/hooks/useBottomNavigationVariant';
import Discover from './Discover';

const DiscoverWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  // Set bottom navigation variant for discover
  useBottomNavigationVariant('default');

  return <Discover />;
};

export default DiscoverWrapped;