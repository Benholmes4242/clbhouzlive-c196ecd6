import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import Discover from './Discover';

const DiscoverWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  return <Discover />;
};

export default DiscoverWrapped;