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
    console.log('🔄 Modal state changed:', { 
      isModalOpen, 
      lastOpen: lastOpenStateRef.current,
      hasCurrentSession: !!currentSession 
    });
    
    if (isModalOpen && !lastOpenStateRef.current) {
      // Modal just opened - start new session
      console.log('📂 Modal opened, starting new session');
      startNewSession();
      sessionStartTimeRef.current = new Date();
      lastOpenStateRef.current = true;
    } else if (!isModalOpen && lastOpenStateRef.current) {
      // Modal just closed - save current session
      console.log('🔚 Modal closed, checking session for save...', {
        hasSession: !!currentSession,
        messageCount: currentSession?.messages.length || 0
      });
      
      if (currentSession && currentSession.messages.length > 0) {
        console.log('💾 Session has messages, saving...');
        saveCurrentSession();
      } else {
        console.log('⚠️ No session or messages to save');
      }
      
      setCurrentSession(null);
      sessionStartTimeRef.current = null;
      lastOpenStateRef.current = false;
    }
  }, [isModalOpen, currentSession]);

  // Load conversations from Supabase on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    console.log('📖 Loading conversations from Supabase...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading conversations:', error);
        return;
      }

      console.log('📊 Loaded conversations from DB:', data?.length || 0);
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
        console.log('✅ Conversations loaded:', conversationsWithDates.length);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
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
    // Generate proper UUID instead of timestamp-based ID
    const uuid = crypto.randomUUID();
    const now = new Date();
    
    const newSession: ConversationSession = {
      id: uuid,
      title: '', // Will be set with first user message
      messages: [],
      createdAt: now,
      lastActivityAt: now,
      sessionStartTime: now
    };
    
    console.log('📝 Created new session with UUID:', uuid);
    setCurrentSession(newSession);
  };

  const addMessage = async (message: ConversationMessage) => {
    console.log('➕ Adding message:', { 
      hasSession: !!currentSession, 
      messageType: message.type,
      sessionId: currentSession?.id,
      currentMessageCount: currentSession?.messages.length || 0
    });
    
    if (!currentSession) {
      console.log('❌ No current session, starting new one');
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

    console.log('✅ Session updated, now has', updatedSession.messages.length, 'messages');
    setCurrentSession(updatedSession);

    // Auto-save after EVERY message to ensure both user and AI messages are persisted
    console.log('💾 Auto-saving session after message:', message.type);
    await saveSessionToDB(updatedSession);
  };

  const saveSessionToDB = async (session: ConversationSession) => {
    console.log('💾 Saving specific session to DB:', {
      sessionId: session.id,
      messageCount: session.messages.length,
      title: session.title
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user for save');
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .upsert({
          id: session.id,
          user_id: user.id,
          title: session.customTitle || session.title,
          messages: session.messages as any
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase upsert error:', error);
        return;
      }

      console.log('✅ Session saved successfully to DB:', data);
      // Reload conversations to sync with UI
      await loadConversations();
    } catch (error) {
      console.error('❌ Exception during session save:', error);
    }
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
      if (!user) {
        console.log('❌ No authenticated user for save');
        return;
      }

      console.log('👤 User authenticated, proceeding with save:', user.id);

      // Save to Supabase
      console.log('💾 Calling Supabase upsert with data:', {
        id: currentSession.id,
        user_id: user.id,
        title: currentSession.customTitle || currentSession.title,
        messageCount: currentSession.messages.length
      });

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
        console.error('❌ Supabase upsert error:', error);
        return;
      }

      console.log('✅ Conversation saved successfully to DB:', data);

      // Reload conversations from Supabase to ensure sync
      console.log('🔄 Reloading conversations after save...');
      await loadConversations();
      
    } catch (error) {
      console.error('❌ Exception during save:', error);
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