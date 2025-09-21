import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Auth from './Auth';

const AuthWrapped = () => {
  // No need to set variant anymore - it's locked to glass-dark
  return <Auth />;
};

export default AuthWrapped;