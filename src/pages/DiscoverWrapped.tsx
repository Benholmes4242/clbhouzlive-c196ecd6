import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Discover from './Discover';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const DiscoverWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  return (
    <>
      <Discover />
      <ScrollToTopGlass />
    </>
  );
};

export default DiscoverWrapped;