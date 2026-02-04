/**
 * HubEchoChatPage - Redirects to full Echo page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HubEchoChatPage() {
  const nav = useNavigate();

  useEffect(() => {
    nav('/echo', { replace: true });
  }, [nav]);

  return null;
}
