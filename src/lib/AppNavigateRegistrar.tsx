import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAppNavigate } from '@/lib/appNavigate';

/** Mounted once inside BrowserRouter; see appNavigate.ts. */
export function AppNavigateRegistrar() {
  const navigate = useNavigate();
  useEffect(() => {
    registerAppNavigate((to) => navigate(to));
    return () => registerAppNavigate(null);
  }, [navigate]);
  return null;
}
