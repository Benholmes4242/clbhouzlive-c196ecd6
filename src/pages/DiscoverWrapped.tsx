import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Discover from './Discover';

const DiscoverWrapped = () => {
  // No need to set variant anymore - it's locked to glass-dark
  return <Discover />;
};

export default DiscoverWrapped;