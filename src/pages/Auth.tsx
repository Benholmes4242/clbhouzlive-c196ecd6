import { useLayoutEffect } from 'react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import NewAuthPage from './auth/NewAuthPage';

export default function Auth() {
  useHideBottomNav();
  useHideHeader();

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => document.body.classList.remove('route-auth');
  }, []);

  return <NewAuthPage />;
}
