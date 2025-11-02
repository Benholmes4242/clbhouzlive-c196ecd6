/**
 * Echo Storage Utilities
 * Persistence layer for conversations using localStorage
 */

import type { EchoConversation } from '../state/echoTypes';

const STORAGE_KEY = 'echo_chat';
const VERSION_KEY = 'echo_chat_version';
const CURRENT_VERSION = 1;

export function loadConversations(): EchoConversation[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== String(CURRENT_VERSION)) {
      console.log('[EchoStorage] Version mismatch, clearing storage');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
      return [];
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[EchoStorage] Error loading conversations:', error);
    return [];
  }
}

export function saveConversations(conversations: EchoConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
  } catch (error) {
    console.error('[EchoStorage] Error saving conversations:', error);
  }
}

export function clearConversations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[EchoStorage] Error clearing conversations:', error);
  }
}
