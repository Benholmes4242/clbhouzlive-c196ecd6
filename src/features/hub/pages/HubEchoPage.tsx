/**
 * Hub Echo Page
 * 
 * Full-page Echo experience integrated inside Hub
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';

export function HubEchoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine which subtab we're on based on route
  const subtab = location.pathname.split('/').pop() || 'chat';
  
  // Close handlers
  const closeToNearby = () => navigate('/hub/golfers', { replace: true });
  const backToChat = () => navigate('/hub/echo/chat');

  return (
    <div className="h-full w-full flex flex-col">
      {subtab === 'history' ? (
        <AIChatHistory
          isOpen={true}
          onClose={backToChat}
          onSelectMessage={backToChat}
          paneMode
          defaultCategory="chat"
        />
      ) : (
        <AIChatOverlay
          isOpen={true}
          onClose={closeToNearby}
          paneMode
          initialTab={subtab === 'swing' ? 'swing' : 'chat'}
        />
      )}
    </div>
  );
}
