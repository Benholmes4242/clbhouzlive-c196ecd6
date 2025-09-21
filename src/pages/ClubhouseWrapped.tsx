import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Clubhouse from './Clubhouse';

const ClubhouseWrapped = () => {
  // No need to set variant anymore - it's locked to glass-dark
  return <Clubhouse />;
};

export default ClubhouseWrapped;