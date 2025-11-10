/**
 * Share Actions API
 * Create, revoke, and resolve share links for Echo conversations
 */

import { supabase } from '@/integrations/supabase/client';

export interface ShareInfo {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface SharedThread {
  thread_id: string;
  title: string;
  created_at: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
  }>;
}

/**
 * Create a share link for a thread
 */
export async function createShareLink(
  threadId: string,
  ttlSeconds?: number
): Promise<string> {
  const { data, error } = await supabase.rpc('echo_share_create', {
    p_thread_id: threadId,
    p_ttl_seconds: ttlSeconds || null,
  });

  if (error) {
    console.error('Failed to create share link:', error);
    throw new Error(error.message || 'Failed to create share link');
  }

  return data as string;
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(token: string): Promise<void> {
  const { error } = await supabase.rpc('echo_share_revoke', {
    p_token: token,
  });

  if (error) {
    console.error('Failed to revoke share link:', error);
    throw new Error(error.message || 'Failed to revoke share link');
  }
}

/**
 * Get share info for a thread (owner only)
 */
export async function getShareInfoForThread(
  threadId: string
): Promise<ShareInfo | null> {
  const { data, error } = await supabase.rpc('echo_share_get_by_thread', {
    p_thread_id: threadId,
  });

  if (error) {
    console.error('Failed to get share info:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as ShareInfo;
}

/**
 * Get shared thread by token (public access)
 */
export async function getSharedThread(token: string): Promise<SharedThread> {
  const { data, error } = await supabase.rpc('echo_share_get_thread', {
    p_token: token,
  });

  if (error) {
    console.error('Failed to get shared thread:', error);
    throw new Error(error.message || 'Invalid or expired share link');
  }

  if (!data || data.length === 0) {
    throw new Error('Share link not found');
  }

  const thread = data[0];
  return {
    thread_id: thread.thread_id,
    title: thread.title,
    created_at: thread.created_at,
    messages: (thread.messages as any[]) || [],
  };
}
