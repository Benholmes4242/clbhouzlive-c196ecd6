/**
 * Hub Create Game Page
 * Redirects to /hub - Create Game is now a sheet
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HubCreateGamePage() {
  const nav = useNavigate();
  
  useEffect(() => {
    nav('/hub', { replace: true });
  }, [nav]);

  return null;
}
