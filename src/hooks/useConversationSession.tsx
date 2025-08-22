import { useState, useEffect, useRef } from 'react';

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ConversationSession {
  id: string;
  title: string;
  customTitle?: string;
  messages: ConversationMessage[];
  createdAt: Date;
  lastActivityAt: Date;
  sessionStartTime: Date;
}

interface UseConversationSessionProps {
  storageKey: string;
  isModalOpen: boolean;
}

export const useConversationSession = ({ storageKey, isModalOpen }: UseConversationSessionProps) => {
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const lastOpenStateRef = useRef<boolean>(false);

  // Initialize conversation session on modal open - only when isModalOpen is true
  useEffect(() => {
    // Skip session management if isModalOpen is explicitly false
    if (isModalOpen === false) {
      return;
    }
    
    if (isModalOpen && !lastOpenStateRef.current) {
      // Modal just opened - start new session
      startNewSession();
      sessionStartTimeRef.current = new Date();
    } else if (!isModalOpen && lastOpenStateRef.current && currentSession) {
      // Modal just closed - save current session
      saveCurrentSession();
      setCurrentSession(null);
      sessionStartTimeRef.current = null;
    }
    
    lastOpenStateRef.current = isModalOpen;
  }, [isModalOpen]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem(`${storageKey}_conversations`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          lastActivityAt: new Date(conv.lastActivityAt),
          sessionStartTime: new Date(conv.sessionStartTime),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(conversationsWithDates);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversations = (updatedConversations: ConversationSession[]) => {
    try {
      localStorage.setItem(`${storageKey}_conversations`, JSON.stringify(updatedConversations));
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  const startNewSession = () => {
    const sessionId = `session_${Date.now()}`;
    const now = new Date();
    
    const newSession: ConversationSession = {
      id: sessionId,
      title: '', // Will be set with first user message
      messages: [],
      createdAt: now,
      lastActivityAt: now,
      sessionStartTime: now
    };
    
    setCurrentSession(newSession);
  };

  const addMessage = (message: ConversationMessage) => {
    if (!currentSession) {
      startNewSession();
      return;
    }

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, message],
      lastActivityAt: new Date()
    };

    // Set title to first user message if not already set
    if (!updatedSession.title && message.type === 'user') {
      updatedSession.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }

    setCurrentSession(updatedSession);
  };

  const saveCurrentSession = () => {
    if (!currentSession || currentSession.messages.length === 0) {
      return;
    }

    // Check if session already exists in conversations
    const existingIndex = conversations.findIndex(conv => conv.id === currentSession.id);
    
    let updatedConversations: ConversationSession[];
    if (existingIndex >= 0) {
      // Update existing conversation
      updatedConversations = [...conversations];
      updatedConversations[existingIndex] = currentSession;
    } else {
      // Add new conversation
      updatedConversations = [currentSession, ...conversations];
    }

    // Sort by last activity (most recent first)
    updatedConversations.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
    
    saveConversations(updatedConversations);
  };

  const renameConversation = (conversationId: string, newTitle: string) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, customTitle: newTitle }
        : conv
    );
    
    saveConversations(updatedConversations);
    
    // Update current session if it's the one being renamed
    if (currentSession && currentSession.id === conversationId) {
      setCurrentSession({ ...currentSession, customTitle: newTitle });
    }
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    saveConversations(updatedConversations);
    
    // Clear current session if it's the one being deleted
    if (currentSession && currentSession.id === conversationId) {
      setCurrentSession(null);
    }
  };

  const clearAllConversations = () => {
    localStorage.removeItem(`${storageKey}_conversations`);
    setConversations([]);
    setCurrentSession(null);
  };

  const startNewConversationManually = () => {
    // Save current session if exists
    if (currentSession && currentSession.messages.length > 0) {
      saveCurrentSession();
    }
    
    // Start fresh session
    startNewSession();
  };

  const getDisplayTitle = (conversation: ConversationSession): string => {
    return conversation.customTitle || conversation.title || 'New conversation';
  };

  return {
    currentSession,
    conversations,
    addMessage,
    saveCurrentSession,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    startNewConversationManually,
    getDisplayTitle,
    loadConversations
  };
};