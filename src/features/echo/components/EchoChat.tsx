/**
 * Echo Chat Component
 * Simple chat interface combining ChatThread + ChatComposer
 */

import React, { useEffect } from 'react';
import { ChatThread } from './ChatThread';
import { ChatComposer } from './ChatComposer';
import { useEchoConversationsContext } from './EchoConversationsProvider';
import { useToast } from '@/hooks/use-toast';

export function EchoChat() {
  const {
    activeConversation,
    isStreaming,
    dispatch,
    createConversation,
  } = useEchoConversationsContext();

  const { toast } = useToast();

  // Create a default conversation on mount if none exists
  useEffect(() => {
    if (!activeConversation) {
      createConversation('New Chat');
    }
  }, [activeConversation, createConversation]);

  const handleSend = async (content: string) => {
    if (!activeConversation) {
      toast({
        title: 'No conversation',
        description: 'Please start a conversation first',
        variant: 'destructive',
      });
      return;
    }

    // Add user message
    dispatch({ type: 'APPEND_USER', content });

    // Start streaming
    dispatch({ type: 'BEGIN_ASSISTANT' });

    try {
      // TODO: Call AI API here - for now just mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({
        type: 'APPEND_ASSISTANT',
        content: "I'm Echo, your golf AI assistant. I'm still being set up, but I'll help you with golf questions soon!",
      });
      
      dispatch({
        type: 'END_ASSISTANT',
        meta: { latency: 1000 },
      });
    } catch (error) {
      dispatch({
        type: 'ERROR_ASSISTANT',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStop = () => {
    // TODO: Implement stop streaming
    console.log('Stop streaming');
  };

  return (
    <div className="flex flex-col h-full">
      <ChatThread
        messages={activeConversation?.messages || []}
        isStreaming={isStreaming}
      />
      <div className="border-t" style={{ borderColor: 'var(--hub-stroke)' }}>
        <ChatComposer
          onSend={handleSend}
          onStop={handleStop}
          disabled={!activeConversation}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
