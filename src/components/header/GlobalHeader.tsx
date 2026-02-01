import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import CompactHeader from './CompactHeader';
import { useModalContext } from '@/contexts/ModalContext';
import { isGlobalHeaderExcluded, isConditionallyExcluded } from './globalHeaderRules';

/**
 * GlobalHeader - Renders CompactHeader on all pages except:
 * - Clubhouse (/ and /clubhouse) - has its own dark header
 * - Auth pages (/auth, /signup, /onboarding) - clean auth flow
 * - Admin pages (/admin/*) - separate admin layout
 * - Hub overlays and full-screen modals
 * - Create moment page - full-screen composer
 * - Tour Hub Overview (/tourhub with tab=overview or no tab) - immersive hero
 */
const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shouldHideHeader } = useModalContext();

  const pathname = location.pathname;

  // Check both static exclusions and conditional (query-param based) exclusions
  if (shouldHideHeader || isGlobalHeaderExcluded(pathname) || isConditionallyExcluded(pathname, searchParams)) {
    return null;
  }

  return <CompactHeader />;
};

export default GlobalHeader;
