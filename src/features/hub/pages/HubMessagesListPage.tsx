/**
 * HubMessagesListPage - Redirects to Hub (Messages is now a bottom sheet)
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function HubMessagesListPage() {
  const nav = useNavigate();

  useEffect(() => {
    // Redirect to Hub since Messages is now a sheet, not a page
    nav('/hub', { replace: true });
  }, [nav]);

  return null;
}
