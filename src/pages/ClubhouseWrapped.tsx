import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Clubhouse from './Clubhouse';

const ClubhouseWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  return <Clubhouse />;
};

export default ClubhouseWrapped;