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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations from Supabase:', error);
        return;
      }

      if (data) {
        const conversationsWithDates = data.map((conv: any) => ({
          id: conv.id,
          title: conv.title || '',
          customTitle: conv.title,
          messages: conv.messages || [],
          createdAt: new Date(conv.created_at),
          lastActivityAt: new Date(conv.updated_at),
          sessionStartTime: new Date(conv.created_at)
        }));
        setConversations(conversationsWithDates);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversations = async (updatedConversations: ConversationSession[]) => {
    try {
      setConversations(updatedConversations);
      // Supabase saving is handled in saveCurrentSession
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

  const saveCurrentSession = async () => {
    console.log('💾 Attempting to save session:', {
      hasSession: !!currentSession,
      messageCount: currentSession?.messages.length || 0,
      sessionId: currentSession?.id
    });
    
    if (!currentSession || currentSession.messages.length === 0) {
      console.log('⚠️ No session to save or no messages');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to Supabase
      const { data, error } = await supabase
        .from('conversations')
        .upsert({
          id: currentSession.id,
          user_id: user.id,
          title: currentSession.customTitle || currentSession.title,
          messages: currentSession.messages as any
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving conversation to Supabase:', error);
        return;
      }

      console.log('✅ Conversation saved successfully:', data);

      // Reload conversations from Supabase to ensure sync
      await loadConversations();
      
    } catch (error) {
      console.error('Error saving session:', error);
    }
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

  const deleteConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting conversation:', error);
        return;
      }

      const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
      setConversations(updatedConversations);
      
      if (currentSession && currentSession.id === conversationId) {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const clearAllConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

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