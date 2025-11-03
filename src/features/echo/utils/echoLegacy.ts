// src/features/echo/utils/echoLegacy.ts
export type ChatMessageRow = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  metadata?: any;
};

export type ChatConversationRow = {
  id: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
  messages: ChatMessageRow[];
};

export function safeParse<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function mapLegacyConv(hit: any): ChatConversationRow | null {
  if (!hit || typeof hit !== 'object') return null;

  const convId =
    hit.id ?? (globalThis.crypto?.randomUUID?.() ?? `conv-${Date.now()}`);
  const createdAt = hit.createdAt || hit.timestamp || new Date().toISOString();
  const lastActivityAt = hit.lastActivityAt || createdAt;

  const messages: ChatMessageRow[] = Array.isArray(hit.messages)
    ? hit.messages.map((m: any, i: number) => ({
        id: m.id ?? `${convId}-${i}`,
        type: (m.role || m.type) === 'user' ? 'user' : 'ai',
        content: String(m.content ?? ''),
        timestamp: m.timestamp || createdAt,
        metadata: m.meta || m.metadata,
      }))
    : [];

  return {
    id: convId,
    title: hit.customTitle || hit.title || 'Untitled conversation',
    createdAt,
    lastActivityAt,
    messages,
  };
}

/** Return legacy conversations as an array (object-map or array supported) */
export function getLegacyConversations(): ChatConversationRow[] {
  const legacy = safeParse<Record<string, any> | any[]>('echo_chat');
  if (!legacy) return [];
  const arr = Array.isArray(legacy) ? legacy : Object.values(legacy);
  return arr.map(mapLegacyConv).filter(Boolean) as ChatConversationRow[];
}
