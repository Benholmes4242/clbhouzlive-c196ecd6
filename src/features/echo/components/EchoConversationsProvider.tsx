/**
 * Echo Conversations Provider
 * Provides conversation state to Echo components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useEchoConversations } from '../hooks/useEchoConversations';
import type { EchoConversation, EchoAction } from '../state/echoTypes';

interface EchoConversationsContextValue {
  conversations: EchoConversation[];
  activeConversation: EchoConversation | undefined;
  isStreaming: boolean;
  dispatch: (action: EchoAction) => void;
  createConversation: (title?: string) => void;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
}

const EchoConversationsContext = createContext<EchoConversationsContextValue | null>(null);

export function EchoConversationsProvider({ children }: { children: ReactNode }) {
  const echoState = useEchoConversations();
  
  console.log('🟢 [EchoConversationsProvider] Rendering with conversations:', echoState.conversations.length);

  return (
    <EchoConversationsContext.Provider value={echoState}>
      {children}
    </EchoConversationsContext.Provider>
  );
}

export function useEchoConversationsContext() {
  const context = useContext(EchoConversationsContext);
  if (!context) {
    throw new Error('useEchoConversationsContext must be used within EchoConversationsProvider');
  }
  return context;
}

// Optional version that returns null instead of throwing
export function useEchoConversationsOptional() {
  const context = useContext(EchoConversationsContext);
  return context;
}
