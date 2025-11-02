/**
 * Echo AI Chat Reducer
 * State management for conversations and messages
 */

import { nanoid } from 'nanoid';
import type { EchoState, EchoAction, EchoConversation, EchoMessage } from './echoTypes';

export const initialEchoState: EchoState = {
  conversations: [],
  activeConversationId: null,
  isStreaming: false,
};

export function echoReducer(state: EchoState, action: EchoAction): EchoState {
  switch (action.type) {
    case 'LOAD_CONVERSATIONS':
      return {
        ...state,
        conversations: action.conversations,
      };

    case 'NEW_CONVERSATION': {
      const newConvo: EchoConversation = {
        id: nanoid(),
        title: action.title || 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      return {
        ...state,
        conversations: [newConvo, ...state.conversations],
        activeConversationId: newConvo.id,
      };
    }

    case 'SELECT_CONVERSATION':
      return {
        ...state,
        activeConversationId: action.id,
      };

    case 'RENAME_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.id
            ? { ...c, title: action.title, updatedAt: new Date().toISOString() }
            : c
        ),
      };

    case 'DELETE_CONVERSATION': {
      const filtered = state.conversations.filter(c => c.id !== action.id);
      return {
        ...state,
        conversations: filtered,
        activeConversationId:
          state.activeConversationId === action.id
            ? filtered[0]?.id || null
            : state.activeConversationId,
      };
    }

    case 'APPEND_USER': {
      if (!state.activeConversationId) return state;
      
      const userMsg: EchoMessage = {
        id: nanoid(),
        role: 'user',
        content: action.content,
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === state.activeConversationId
            ? {
                ...c,
                messages: [...c.messages, userMsg],
                updatedAt: new Date().toISOString(),
                // Auto-generate title from first message
                title: c.messages.length === 0 
                  ? action.content.slice(0, 40) + (action.content.length > 40 ? '...' : '')
                  : c.title,
              }
            : c
        ),
      };
    }

    case 'BEGIN_ASSISTANT': {
      if (!state.activeConversationId) return state;
      
      const assistantMsg: EchoMessage = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        isStreaming: true,
        conversations: state.conversations.map(c =>
          c.id === state.activeConversationId
            ? { ...c, messages: [...c.messages, assistantMsg] }
            : c
        ),
      };
    }

    case 'APPEND_ASSISTANT': {
      if (!state.activeConversationId) return state;

      return {
        ...state,
        conversations: state.conversations.map(c => {
          if (c.id !== state.activeConversationId) return c;
          
          const messages = [...c.messages];
          const lastMsg = messages[messages.length - 1];
          
          if (lastMsg?.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + action.content,
            };
          }
          
          return { ...c, messages, updatedAt: new Date().toISOString() };
        }),
      };
    }

    case 'END_ASSISTANT': {
      if (!state.activeConversationId) return state;

      return {
        ...state,
        isStreaming: false,
        conversations: state.conversations.map(c => {
          if (c.id !== state.activeConversationId) return c;
          
          const messages = [...c.messages];
          const lastMsg = messages[messages.length - 1];
          
          if (lastMsg?.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              meta: { ...lastMsg.meta, ...action.meta },
            };
          }
          
          return { ...c, messages, updatedAt: new Date().toISOString() };
        }),
      };
    }

    case 'ERROR_ASSISTANT': {
      if (!state.activeConversationId) return state;

      return {
        ...state,
        isStreaming: false,
        conversations: state.conversations.map(c => {
          if (c.id !== state.activeConversationId) return c;
          
          const messages = [...c.messages];
          const lastMsg = messages[messages.length - 1];
          
          if (lastMsg?.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              meta: { ...lastMsg.meta, error: action.error },
            };
          }
          
          return { ...c, messages };
        }),
      };
    }

    default:
      return state;
  }
}
