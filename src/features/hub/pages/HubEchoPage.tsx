/**
 * Hub Echo Page
 * 
 * Full-screen Echo page with glass background, rendered over origin page.
 */

import React from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { ChatDetailPane } from './ChatDetailPane';
import { SwingDetailPane } from './SwingDetailPane';
import { useHub } from '../useHub';
import { Z } from '@/config/zIndex';
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
    open(); // Reopen Hub
    navigate(-1); // Go back
  };

  return (
    <>
      {/* Glass background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: Z.hub,
        }}
      />

      {/* Content */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: Z.hub,
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
    </>
  );
}
