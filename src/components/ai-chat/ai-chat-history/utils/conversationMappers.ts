/**
 * Conversation Mappers
 * Utility functions for mapping between conversation data structures
 */

import type { ChatConversationRow } from '@/features/echo/utils/echoLegacy';

interface SessionConversation {
  id: string;
  title: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  messages: Array<{
    id?: string;
    type: 'user' | 'ai';
    content?: string;
    timestamp: Date;
    metadata?: any;
  }>;
}

/**
 * Maps session conversations to ChatConversationRow format
 */
export function mapSessionToRows(input: SessionConversation[]): ChatConversationRow[] {
  return input.map(conv => ({
    id: conv.id,
    title: conv.title ?? 'New conversation',
    createdAt: conv.createdAt.toISOString(),
    lastActivityAt: conv.lastActivityAt.toISOString(),
    messages: conv.messages.map((m, i) => ({
      id: m.id ?? `${conv.id}-${i}`,
      type: m.type === 'user' ? 'user' : 'ai',
      content: m.content ?? '',
      timestamp: m.timestamp.toISOString(),
      metadata: m.metadata,
    })),
  }));
}

/**
 * Safe date parser with fallback to current date
 */
export function toSafeDate(v?: string): Date {
  return v && !Number.isNaN(Date.parse(v)) ? new Date(v) : new Date();
}

/**
 * Groups items by time period (today, this week, this month, older)
 */
export function groupByTimePeriod<T extends { timestamp: Date }>(
  items: T[]
): { today: T[]; thisWeek: T[]; thisMonth: T[]; older: T[] } {
  const now = Date.now();
  
  return items.reduce(
    (acc, item) => {
      const daysDiff = Math.floor((now - item.timestamp.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        acc.today.push(item);
      } else if (daysDiff <= 7) {
        acc.thisWeek.push(item);
      } else if (daysDiff <= 30) {
        acc.thisMonth.push(item);
      } else {
        acc.older.push(item);
      }
      
      return acc;
    },
    { today: [] as T[], thisWeek: [] as T[], thisMonth: [] as T[], older: [] as T[] }
  );
}

/**
 * Filter items based on search query
 */
export function filterBySearch<T>(
  items: T[],
  query: string,
  getSearchableFields: (item: T) => string[]
): T[] {
  if (!query.trim()) return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item =>
    getSearchableFields(item).some(field => 
      field?.toLowerCase().includes(lowerQuery)
    )
  );
}
