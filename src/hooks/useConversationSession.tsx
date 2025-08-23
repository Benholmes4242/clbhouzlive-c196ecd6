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
    console.log('🐛 LOAD DEBUG - Starting to load conversations from Supabase...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ LOAD DEBUG - No user authenticated');
        return;
      }

      console.log('🐛 LOAD DEBUG - User authenticated, querying conversations:', user.id);

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ LOAD DEBUG - Error loading conversations:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        return;
      }

      console.log('🐛 LOAD DEBUG - Raw data from DB:', {
        conversationCount: data?.length || 0,
        conversations: data?.map(conv => {
          const messages = Array.isArray(conv.messages) ? conv.messages : [];
          return {
            id: conv.id,
            title: conv.title,
            messageCount: messages.length,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            messagesPreview: messages.slice(0, 2).map((m: any) => ({ 
              type: m.type, 
              content: m.content?.substring(0, 30) 
            }))
          };
        }) || []
      });

      if (data) {
        const conversationsWithDates = data.map((conv: any) => ({
          id: conv.id,
          title: conv.title || '',
          customTitle: conv.title,
          messages: Array.isArray(conv.messages) ? conv.messages : [],
          createdAt: new Date(conv.created_at),
          lastActivityAt: new Date(conv.updated_at),
          sessionStartTime: new Date(conv.created_at)
        }));
        setConversations(conversationsWithDates);
        console.log('✅ LOAD DEBUG - Conversations processed and set:', {
          processedCount: conversationsWithDates.length,
          conversationsPreview: conversationsWithDates.map(conv => ({
            id: conv.id,
            title: conv.title,
            messageCount: conv.messages.length
          }))
        });
      }
    } catch (error) {
      console.error('❌ LOAD DEBUG - Exception loading conversations:', {
        message: error.message,
        stack: error.stack
      });
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
    console.log('🐛 CONVERSATION DEBUG - Adding message:', { 
      hasSession: !!currentSession, 
      messageType: message.type,
      messageContent: message.content.substring(0, 100),
      sessionId: currentSession?.id,
      currentMessageCount: currentSession?.messages.length || 0,
      currentTitle: currentSession?.title || 'no title',
      timestamp: message.timestamp
    });
    
    if (!currentSession) {
      console.log('❌ CONVERSATION DEBUG - No current session, starting new one');
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
      console.log('🐛 CONVERSATION DEBUG - Set session title:', updatedSession.title);
    } else if (updatedSession.title) {
      console.log('🐛 CONVERSATION DEBUG - Preserving existing title:', updatedSession.title);
    }

    console.log('✅ CONVERSATION DEBUG - Session updated:', {
      sessionId: updatedSession.id,
      messageCount: updatedSession.messages.length,
      title: updatedSession.title,
      preservedTitle: !!updatedSession.title,
      lastMessage: {
        type: message.type,
        content: message.content.substring(0, 50)
      }
    });
    
    setCurrentSession(updatedSession);

    // Auto-save after EVERY message to ensure both user and AI messages are persisted
    console.log('💾 CONVERSATION DEBUG - Auto-saving session after message:', message.type);
    await saveSessionToDB(updatedSession);
  };

  const saveSessionToDB = async (session: ConversationSession) => {
    console.log('🐛 SAVE DEBUG - Starting save to DB:', {
      sessionId: session.id,
      messageCount: session.messages.length,
      title: session.title,
      messagesPreview: session.messages.map(m => ({ type: m.type, content: m.content.substring(0, 30) }))
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ SAVE DEBUG - No authenticated user for save');
        return;
      }

      console.log('🐛 SAVE DEBUG - User authenticated, preparing upsert:', {
        userId: user.id,
        sessionData: {
          id: session.id,
          user_id: user.id,
          title: session.customTitle || session.title,
          messageCount: session.messages.length
        }
      });

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
        console.error('❌ SAVE DEBUG - Supabase upsert error:', {
          error: error.message,
          code: error.code,
          details: error.details
        });
        return;
      }

      console.log('✅ SAVE DEBUG - Session saved successfully to DB:', {
        savedId: data.id,
        savedTitle: data.title,
        savedMessageCount: Array.isArray(data.messages) ? data.messages.length : 0,
        savedMessages: Array.isArray(data.messages) ? data.messages.map((m: any) => ({ type: m.type, content: m.content?.substring(0, 30) })) : []
      });
      
      // Reload conversations to sync with UI
      console.log('🔄 SAVE DEBUG - Reloading conversations after save...');
      await loadConversations();
    } catch (error) {
      console.error('❌ SAVE DEBUG - Exception during session save:', {
        message: error.message,
        stack: error.stack
      });
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