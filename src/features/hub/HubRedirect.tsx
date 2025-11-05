/**
 * Hub Redirect
 * 
 * Handles direct navigation to /hub (from bottom nav, URL bar, etc.)
 * Opens Hub over the current location.
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function HubRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Navigate to /hub with clubhouse as background
    navigate('/hub', { 
      state: { backgroundLocation: { ...location, pathname: '/clubhouse' } },
      replace: true 
    });
  }, [navigate, location]);

  return null;
}

