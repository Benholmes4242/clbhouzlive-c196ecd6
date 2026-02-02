/**
 * useConversationPagination Hook
 * Handles pagination for chat conversations from DB and legacy localStorage
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLegacyConversations } from '@/features/echo/utils/echoLegacy';
import { toSafeDate } from '../utils/conversationMappers';
import type { ChatConversation } from '../types';

const PAGE_SIZE = 20;

interface UseConversationPaginationReturn {
  conversations: ChatConversation[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadPage: (nextPage?: number) => Promise<void>;
  deleteConversation: (id: string) => void;
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>;
}

export function useConversationPagination(): UseConversationPaginationReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadPage = useCallback(async (nextPage = 0) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const rows: Array<{
        id: string;
        title: string;
        dateISO: string;
        count?: number;
        source: 'db' | 'legacy';
      }> = [];

      // 1) DB first (when available) - DB takes precedence
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const from = nextPage * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error: dbError } = await supabase
            .from('echo_threads')
            .select('id, first_user_question, last_activity_at, created_at, message_count')
            .eq('user_id', user.id)
            .order('last_activity_at', { ascending: false, nullsFirst: false })
            .range(from, to);

          if (!dbError && data) {
            for (const conv of data) {
              rows.push({
                id: conv.id,
                title: conv.first_user_question ?? 'New conversation',
                dateISO: conv.last_activity_at || conv.created_at,
                count: conv.message_count || 0,
                source: 'db'
              });
            }
          }
        }
      } catch (e) {
        console.warn('DB chat history load skipped', e);
      }

      // 2) Legacy localStorage (merged)
      try {
        const legacy = getLegacyConversations();
        for (const conv of legacy) {
          rows.push({
            id: conv.id,
            title: conv.title,
            dateISO: conv.lastActivityAt || conv.createdAt,
            count: conv.messages?.length || undefined,
            source: 'legacy'
          });
        }
      } catch (e) {
        console.warn('Legacy chat history load skipped', e);
      }

      // 3) De-dup by id (DB wins over legacy), sort desc
      const dedup = new Map<string, typeof rows[0]>();
      for (const r of rows) {
        if (r.id && (!dedup.has(r.id) || r.source === 'db')) {
          dedup.set(r.id, r);
        }
      }
      const merged = Array.from(dedup.values())
        .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
        .slice(0, PAGE_SIZE);

      // Map to UI format
      const uiRows: ChatConversation[] = merged.map(row => ({
        id: row.id,
        title: row.title,
        customTitle: row.title,
        messages: [],
        timestamp: toSafeDate(row.dateISO),
        createdAt: toSafeDate(row.dateISO),
        lastActivityAt: toSafeDate(row.dateISO),
        messageCount: row.count,
        source: row.source
      }));

      setHasMore(merged.length === PAGE_SIZE);
      setConversations(prev => nextPage === 0 ? uiRows : [...prev, ...uiRows]);
      setPage(nextPage);

      console.log('✅ [useConversationPagination] Loaded:', {
        page: nextPage,
        loaded: merged.length,
        dbCount: rows.filter(r => r.source === 'db').length,
        legacyCount: rows.filter(r => r.source === 'legacy').length
      });
    } catch (err) {
      console.error('Failed to load chat conversations:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
  }, []);

  return {
    conversations,
    isLoading,
    error,
    hasMore,
    page,
    loadPage,
    deleteConversation,
    setConversations
  };
}
