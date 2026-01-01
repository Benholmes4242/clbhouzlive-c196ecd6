import React from 'react';
import { useLocation } from 'react-router-dom';
import CompactHeader from './CompactHeader';
import { useModalContext } from '@/contexts/ModalContext';

/**
 * GlobalHeader - Renders CompactHeader on all pages except:
 * - Clubhouse (/ and /clubhouse) - has its own dark header
 * - Auth pages (/auth, /signup, /onboarding) - clean auth flow
 * - Admin pages (/admin/*) - separate admin layout
 * - Hub overlays and full-screen modals
 * - Create moment page - full-screen composer
 */
const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const { shouldHideHeader } = useModalContext();
  
  const pathname = location.pathname;
  
  // Routes that should NOT show the global header
  const excludedRoutes = [
    '/', // Clubhouse home
    '/clubhouse',
    '/auth',
    '/auth/callback',
    '/auth/verified',
    '/signup',
    '/onboarding',
    '/create-moment',
  ];
  
  // Check if current path starts with excluded prefixes
  const excludedPrefixes = [
    '/admin',
    '/hub', // Hub has its own overlay handling
  ];
  
  // Check exact matches
  const isExcludedExact = excludedRoutes.some(route => pathname === route);
  
  // Check prefix matches
  const isExcludedPrefix = excludedPrefixes.some(prefix => pathname.startsWith(prefix));
  
  // Hide header for full-screen modals
  if (shouldHideHeader || isExcludedExact || isExcludedPrefix) {
    return null;
  }
  
  return <CompactHeader />;
};

export default GlobalHeader;
