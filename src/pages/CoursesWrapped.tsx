import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import Courses from './Courses';

/**
 * CoursesWrapped - Resets header variant and CinemaDimContext on mount.
 * Prevents stale dim state from previous pages (course detail, profile,
 * tourhub overview) causing the header to flash transparent.
 * Mirrors DiscoverWrapped pattern exactly.
 */
const CoursesWrapped = () => {
  const { setVariant } = useHeader();
  const { setDimmablePage, setIsLightDimmed } = useCinemaDimContext();

  useEffect(() => {
    setVariant('solid-light');
    setDimmablePage(null);
    setIsLightDimmed(false);
  }, [setVariant, setDimmablePage, setIsLightDimmed]);

  return <Courses />;
};

export default CoursesWrapped;
