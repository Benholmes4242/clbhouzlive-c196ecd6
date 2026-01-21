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
    if (isModalOpen && !lastOpenStateRef.current) {
      // Modal just opened - start new session
      startNewSession();
      sessionStartTimeRef.current = new Date();
      lastOpenStateRef.current = true;
    } else if (!isModalOpen && lastOpenStateRef.current) {
      // Modal just closed - no need to save here since we save after each message
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('echo_threads')
        .select('id, first_user_question, created_at, last_activity_at, message_count')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false, nullsFirst: false });

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
        conversations: data?.map(conv => ({
          id: conv.id,
          title: conv.first_user_question,
          messageCount: conv.message_count,
          created_at: conv.created_at,
          updated_at: conv.last_activity_at,
        })) || []
      });

      if (data) {
        // Fetch messages for each thread
        const conversationsWithDates = await Promise.all(data.map(async (conv) => {
          const { data: msgs } = await supabase
            .from('echo_messages')
            .select('id, role, content, created_at')
            .eq('thread_id', conv.id)
            .order('created_at', { ascending: true });

          return {
            id: conv.id,
            title: conv.first_user_question || '',
            customTitle: conv.first_user_question,
            messages: (msgs || []).map((m: any) => ({
              id: m.id,
              type: m.role === 'user' ? 'user' : 'ai' as 'user' | 'ai',
              content: m.content,
              timestamp: new Date(m.created_at),
            })),
            createdAt: new Date(conv.created_at),
            lastActivityAt: new Date(conv.last_activity_at || conv.created_at),
            sessionStartTime: new Date(conv.created_at)
          };
        }));
        setConversations(conversationsWithDates as any);
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

  // Load conversations without clobbering current session
  const loadConversationsWithoutClobbering = async () => {
    console.log('🐛 LOAD DEBUG - Loading conversations list without clobbering current session...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ LOAD DEBUG - No user authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ LOAD DEBUG - Error loading conversations:', error);
        return;
      }

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
        
        // Only update the conversations list, preserve currentSession
        setConversations(conversationsWithDates);
        console.log('✅ LOAD DEBUG - Conversations list updated without clobbering current session');
      }
    } catch (error) {
      console.error('❌ LOAD DEBUG - Exception loading conversations:', error);
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
      messageType: message.type,
      messageContent: message.content.substring(0, 100),
      timestamp: message.timestamp
    });
    
    // Normalize message to ensure consistent format
    const normalizedMessage = {
      id: message.id || crypto.randomUUID(),
      type: message.type,
      content: message.content,
      timestamp: message.timestamp,
      metadata: message.metadata || null
    };

    let sessionToSave: ConversationSession | null = null;

    // Use functional state update to prevent stale state issues
    setCurrentSession(prev => {
      // If no session, create a new one on the fly
      const baseSession = prev || {
        id: crypto.randomUUID(),
        title: '',
        messages: [],
        createdAt: new Date(),
        lastActivityAt: new Date(),
        sessionStartTime: new Date()
      };

      console.log('🐛 CONVERSATION DEBUG - Functional update:', {
        prevSessionId: baseSession.id,
        prevMessageCount: baseSession.messages.length,
        prevTitle: baseSession.title || 'no title'
      });

      // Create updated session with new message
      const updatedSession = {
        ...baseSession,
        messages: [...baseSession.messages, normalizedMessage],
        lastActivityAt: new Date()
      };

      // Set title from first user message only
      if (!updatedSession.title?.trim() && normalizedMessage.type === 'user') {
        updatedSession.title = normalizedMessage.content.slice(0, 50) + (normalizedMessage.content.length > 50 ? '...' : '');
        console.log('🐛 CONVERSATION DEBUG - Set session title:', updatedSession.title);
      }

      console.log('✅ CONVERSATION DEBUG - Session updated:', {
        sessionId: updatedSession.id,
        messageCount: updatedSession.messages.length,
        title: updatedSession.title,
        preservedTitle: !!updatedSession.title,
        messageType: normalizedMessage.type
      });

      // Capture for saving outside of setState
      sessionToSave = updatedSession;
      return updatedSession;
    });

    // Wait for state update to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Auto-save after EVERY message to ensure both user and AI messages are persisted
    console.log('💾 CONVERSATION DEBUG - Auto-saving session after message:', normalizedMessage.type);
    if (sessionToSave) {
      await saveSessionToDB(sessionToSave);
    } else {
      console.error('❌ CONVERSATION DEBUG - sessionToSave is null, cannot save!');
    }
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
      
      // Reload conversations list but DON'T clobber currentSession
      console.log('🔄 SAVE DEBUG - Reloading conversations list after save...');
      await loadConversationsWithoutClobbering();
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