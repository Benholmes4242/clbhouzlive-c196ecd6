import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  // Load conversations from Supabase on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const conversationsWithDates = data?.map((conv: any) => ({
        id: conv.id,
        title: conv.title || 'New conversation',
        customTitle: conv.title,
        messages: conv.messages || [],
        createdAt: new Date(conv.created_at),
        lastActivityAt: new Date(conv.updated_at),
        sessionStartTime: new Date(conv.created_at)
      })) || [];

      setConversations(conversationsWithDates);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversations = async (updatedConversations: ConversationSession[]) => {
    setConversations(updatedConversations);
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

  const saveCurrentSession = async () => {
    if (!currentSession || currentSession.messages.length === 0) {
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        console.error('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .upsert({
          id: currentSession.id,
          title: currentSession.title,
          messages: JSON.parse(JSON.stringify(currentSession.messages)), // Convert to JSON
          user_id: user.data.user.id
        });

      if (error) {
        console.error('Error saving conversation:', error);
        return;
      }

      // Reload conversations to get updated list
      await loadConversations();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const renameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);

      if (error) {
        console.error('Error renaming conversation:', error);
        return;
      }

      // Update local state
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, customTitle: newTitle, title: newTitle }
          : conv
      );
      
      setConversations(updatedConversations);
      
      // Update current session if it's the one being renamed
      if (currentSession && currentSession.id === conversationId) {
        setCurrentSession({ ...currentSession, customTitle: newTitle, title: newTitle });
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return;
      }

      // Update local state
      const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
      setConversations(updatedConversations);
      
      // Clear current session if it's the one being deleted
      if (currentSession && currentSession.id === conversationId) {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const clearAllConversations = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error('Error clearing conversations:', error);
        return;
      }

      setConversations([]);
      setCurrentSession(null);
    } catch (error) {
      console.error('Error clearing conversations:', error);
    }
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