/**
 * Hub Games Page
 * Redirects to /hub - Games is now a sheet
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HubGamesPage() {
  const nav = useNavigate();
  
  useEffect(() => {
    nav('/hub', { replace: true });
  }, [nav]);

  return null;
}