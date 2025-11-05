/**
 * Hub Echo Page
 * 
 * Full-page Echo experience integrated inside Hub
 */

import React from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useHub } from '@/features/hub/useHub';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { ChatDetailPane } from './ChatDetailPane';
import { SwingDetailPane } from './SwingDetailPane';
import '../home/hubTheme.css';

export function HubEchoPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { open } = useHub();

  // Explicit redirect for /hub/echo to /hub/echo/chat
  const isIndex = pathname === '/hub/echo' || pathname === '/hub/echo/';
  
  if (isIndex) {
    return <Navigate to="/hub/echo/chat" replace />;
  }

  const handleClose = () => {
    const state = (window.history.state?.usr as any) || {};
    if (state?.backgroundLocation) {
      open();
    } else {
      navigate('/clubhouse', { replace: true });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      <EchoConversationsProvider>
        <div className="h-full w-full">
          <Routes>
          <Route index element={<Navigate to="chat" replace />} />
          <Route
            path="chat"
            element={
                <AIChatOverlay
                  isOpen={true}
                  onClose={handleClose}
                  paneMode
                  layout="page"
                  initialTab="chat"
                />
            }
          />
          <Route
            path="swing"
            element={
                <AIChatOverlay
                  isOpen={true}
                  onClose={handleClose}
                  paneMode
                  layout="page"
                  initialTab="swing"
                />
            }
          />
          <Route
            path="history"
            element={
                <AIChatHistory
                  isOpen={true}
                  onClose={() => navigate('/hub/echo/chat')}
                  onSelectMessage={(id) => navigate(`/hub/echo/history/chat/${id}`)}
                  paneMode
                  layout="page"
                  defaultCategory="chat"
                />
            }
          />
          <Route path="history/chat/:id" element={<ChatDetailPane />} />
          <Route path="history/swing/:id" element={<SwingDetailPane />} />
        </Routes>
        </div>
      </EchoConversationsProvider>
    </div>
  );
}
