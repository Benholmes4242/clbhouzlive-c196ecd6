import React from 'react';
import { useLocation } from 'react-router-dom';
import CompactHeader from './CompactHeader';
import { useModalContext } from '@/contexts/ModalContext';
import { isGlobalHeaderExcluded } from './globalHeaderRules';

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

  if (shouldHideHeader || isGlobalHeaderExcluded(pathname)) {
    return null;
  }

  return <CompactHeader />;
};

export default GlobalHeader;
