/**
 * Hub Echo Page
 * 
 * Inline AI Chat interface within Hub (Phase 4).
 * Full chat experience with history and streaming.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, History } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useEchoConversations } from '@/features/echo/hooks/useEchoConversations';
import { useAIStream } from '@/features/echo/hooks/useAIStream';
import { ChatThread } from '@/features/echo/components/ChatThread';
import { ChatComposer } from '@/features/echo/components/ChatComposer';
import { HistoryPanel } from '@/features/echo/components/HistoryPanel';

interface HubEchoPageProps {
  view?: 'chat' | 'swing' | 'history';
}

export function HubEchoPage({ view = 'chat' }: HubEchoPageProps) {
  const [activeView, setActiveView] = useState<'chat' | 'swing' | 'history'>(view);

  // Update active view when route changes
  useEffect(() => {
    setActiveView(view);
  }, [view]);
  
  const {
    state,
    dispatch,
    conversations,
    activeConversation,
    isStreaming,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
  } = useEchoConversations();

  const { sendMessage, abort } = useAIStream();

  // Track Echo tab open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.echo_open.event, {
        event_category: analyticsEvents.hub.echo_open.category,
        event_label: analyticsEvents.hub.echo_open.label,
      });
    }
  }, []);

  // Create first conversation if none exist
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation();
    }
  }, [conversations.length, createConversation]);

  // Track view changes
  useEffect(() => {
    if (activeView === 'history' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.echo.history_opened.event, {
        event_category: analyticsEvents.echo.history_opened.category,
        event_label: analyticsEvents.echo.history_opened.label,
      });
    }
  }, [activeView]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;

    // Track message sent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.echo.message_sent.event, {
        event_category: analyticsEvents.echo.message_sent.category,
        event_label: analyticsEvents.echo.message_sent.label,
        message_length: content.length,
      });
    }

    // Add user message
    dispatch({ type: 'APPEND_USER', content });

    // Begin assistant response
    dispatch({ type: 'BEGIN_ASSISTANT' });

    // Send to AI
    await sendMessage(
      [...activeConversation.messages, { role: 'user', content }],
      activeConversation.id,
      {
        onChunk: (chunk) => {
          dispatch({ type: 'APPEND_ASSISTANT', content: chunk });
        },
        onComplete: (meta) => {
          dispatch({ type: 'END_ASSISTANT', meta });
        },
        onError: (error) => {
          dispatch({ type: 'ERROR_ASSISTANT', error });
        },
      }
    );
  };

  const handleStopStream = () => {
    abort();
    dispatch({ type: 'END_ASSISTANT' });
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setActiveView('chat');
  };

  const handleNewConversation = () => {
    createConversation();
    setActiveView('chat');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Temporarily hidden - controlled by HubShell primary tabs instead */}

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-background rounded-lg overflow-hidden">
        {activeView === 'chat' && (
          <>
            <ChatThread 
              messages={activeConversation?.messages || []} 
              isStreaming={isStreaming}
            />
            <ChatComposer
              onSend={handleSendMessage}
              onStop={handleStopStream}
              disabled={!activeConversation || isStreaming}
              isStreaming={isStreaming}
            />
          </>
        )}
        
        {activeView === 'swing' && (
          <div className="flex-1 flex items-center justify-center text-white/60">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Swing Coach</p>
              <p className="text-sm">Coming soon</p>
            </div>
          </div>
        )}
        
        {activeView === 'history' && (
          <HistoryPanel
            conversations={conversations}
            activeConversationId={state.activeConversationId}
            onSelect={handleSelectConversation}
            onRename={renameConversation}
            onDelete={deleteConversation}
            onNew={handleNewConversation}
          />
        )}
      </div>
    </div>
  );
}
