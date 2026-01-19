/**
 * Chat History Migration Utility
 * 
 * One-time migration from legacy key (clbhouz_ai_chat) to unified key (echo_chat).
 * Runs automatically on app init, preserves existing echo_chat if present.
 * 
 * @see Phase 1 Audit Report - Section 10.2: Medium Priority Issues
 */

const LEGACY_KEY = 'clbhouz_ai_chat';
const UNIFIED_KEY = 'echo_chat';
const MIGRATION_FLAG_KEY = 'chat_history_migrated_v1';

interface ChatConversation {
  id: string;
  title?: string;
  messages: Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date | string;
    metadata?: any;
  }>;
  timestamp: Date | string;
  createdAt?: Date | string;
  lastActivityAt?: Date | string;
}

/**
 * Migrate chat history from legacy key to unified key
 * 
 * @returns true if migration was performed, false if already migrated or no data
 */
export function migrateChatHistory(): boolean {
  // Skip if already migrated
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    return false;
  }

  try {
    // Check if legacy data exists
    const legacyData = localStorage.getItem(LEGACY_KEY);
    if (!legacyData) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      return false;
    }

    // Parse legacy data
    const legacyConversations = JSON.parse(legacyData) as ChatConversation[];
    
    // Check if unified key already has data
    const unifiedData = localStorage.getItem(UNIFIED_KEY);
    let unifiedConversations: ChatConversation[] = [];
    
    if (unifiedData) {
      unifiedConversations = JSON.parse(unifiedData) as ChatConversation[];
    }

    // Merge conversations, avoiding duplicates by ID
    const existingIds = new Set(unifiedConversations.map(c => c.id));
    const newConversations = legacyConversations.filter(c => !existingIds.has(c.id));
    
    if (newConversations.length > 0) {
      const mergedConversations = [...unifiedConversations, ...newConversations];
      localStorage.setItem(UNIFIED_KEY, JSON.stringify(mergedConversations));
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    
    return true;
  } catch (error) {
    console.error('[ChatMigration] Migration failed:', error);
    return false;
  }
}

/**
 * Force re-run migration (for debugging)
 */
export function resetMigration() {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
}

/**
 * Clean up legacy data after successful migration
 */
export function cleanupLegacyData() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY) !== 'true') {
    console.warn('[ChatMigration] Cannot cleanup - migration not complete');
    return false;
  }

  localStorage.removeItem(LEGACY_KEY);
  return true;
}
