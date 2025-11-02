/**
 * Echo Conversations Hook
 * Manages conversation state and persistence
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { echoReducer, initialEchoState } from '../state/echoReducer';
import { loadConversations, saveConversations } from '../utils/echoStorage';
import type { EchoAction } from '../state/echoTypes';

const SAVE_DEBOUNCE_MS = 250;

export function useEchoConversations() {
  const [state, dispatch] = useReducer(echoReducer, initialEchoState);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load conversations on mount
  useEffect(() => {
    const conversations = loadConversations();
    dispatch({ type: 'LOAD_CONVERSATIONS', conversations });
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveConversations(state.conversations);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.conversations]);

  const createConversation = useCallback((title?: string) => {
    dispatch({ type: 'NEW_CONVERSATION', title });
  }, []);

  const selectConversation = useCallback((id: string) => {
    dispatch({ type: 'SELECT_CONVERSATION', id });
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    dispatch({ type: 'RENAME_CONVERSATION', id, title });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', id });
  }, []);

  const dispatchAction = useCallback((action: EchoAction) => {
    dispatch(action);
  }, []);

  const activeConversation = state.conversations.find(
    c => c.id === state.activeConversationId
  );

  return {
    state,
    dispatch: dispatchAction,
    conversations: state.conversations,
    activeConversation,
    isStreaming: state.isStreaming,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
  };
}
