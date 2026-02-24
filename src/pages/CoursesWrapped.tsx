import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Courses from './Courses';

const CoursesWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
  }, [setVariant]);

  return <Courses />;
};

export default CoursesWrapped;