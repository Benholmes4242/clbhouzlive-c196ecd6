import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Discover from './Discover';

const DiscoverWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  return <Discover />;
};

export default DiscoverWrapped;