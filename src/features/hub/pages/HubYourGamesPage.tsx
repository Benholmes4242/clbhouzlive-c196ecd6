/**
 * Hub Your Games Page
 * Legacy route - redirects to /hub
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HubYourGamesPage() {
  const nav = useNavigate();

  useEffect(() => {
    nav('/hub', { replace: true });
  }, [nav]);

  return null;
}
