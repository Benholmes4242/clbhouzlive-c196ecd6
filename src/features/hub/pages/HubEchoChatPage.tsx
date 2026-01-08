/**
 * HubEchoChatPage - Redirects to Hub (Echo is now a bottom sheet)
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HubEchoChatPage() {
  const nav = useNavigate();

  useEffect(() => {
    nav('/hub', { replace: true });
  }, [nav]);

  return null;
}
