/**
 * Echo AI Chat Types
 * Core data structures for conversations and messages
 */

export type EchoRole = 'user' | 'assistant' | 'system';

export interface EchoMessage {
  id: string;
  role: EchoRole;
  content: string;
  createdAt: string; // ISO timestamp
  meta?: {
    tokens?: number;
    error?: string;
    latency?: number;
    aborted?: boolean;
  };
}

export interface EchoConversation {
  id: string;
  title: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  messages: EchoMessage[];
}

export interface EchoState {
  conversations: EchoConversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
}

export type EchoAction =
  | { type: 'LOAD_CONVERSATIONS'; conversations: EchoConversation[] }
  | { type: 'NEW_CONVERSATION'; title?: string }
  | { type: 'SELECT_CONVERSATION'; id: string }
  | { type: 'RENAME_CONVERSATION'; id: string; title: string }
  | { type: 'DELETE_CONVERSATION'; id: string }
  | { type: 'APPEND_USER'; content: string }
  | { type: 'BEGIN_ASSISTANT' }
  | { type: 'APPEND_ASSISTANT'; content: string }
  | { type: 'END_ASSISTANT'; meta?: { tokens?: number; latency?: number } }
  | { type: 'ERROR_ASSISTANT'; error: string };
