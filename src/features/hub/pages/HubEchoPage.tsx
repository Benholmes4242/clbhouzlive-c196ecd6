/**
 * Hub Echo Page
 * 
 * Full-page Echo experience integrated inside Hub
 */

import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { ChatDetailPane } from './ChatDetailPane';
import { SwingDetailPane } from './SwingDetailPane';

export function HubEchoPage() {
  const navigate = useNavigate();

  return (
    <EchoConversationsProvider>
      <div className="h-full w-full">
        <Routes>
          <Route index element={<Navigate to="chat" replace />} />
          <Route
            path="chat"
            element={
              <AIChatOverlay
                isOpen={true}
                onClose={() => navigate('/hub/golfers', { replace: true })}
                paneMode
                initialTab="chat"
              />
            }
          />
          <Route
            path="swing"
            element={
              <AIChatOverlay
                isOpen={true}
                onClose={() => navigate('/hub/golfers', { replace: true })}
                paneMode
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
                defaultCategory="chat"
              />
            }
          />
          <Route path="history/chat/:id" element={<ChatDetailPane />} />
          <Route path="history/swing/:id" element={<SwingDetailPane />} />
        </Routes>
      </div>
    </EchoConversationsProvider>
  );
}
