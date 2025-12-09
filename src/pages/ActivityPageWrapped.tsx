import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import ActivityPage from './ActivityPage';

const ActivityPageWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  return <ActivityPage />;
};

export default ActivityPageWrapped;
