import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessagingActor } from './useMessagingActor';
import {
  insertOptimistic,
  resolveOptimistic,
  markFailed,
  markSending,
} from './threadCache';
import type { ThreadMessage, MessageType } from '@/types/messaging';

export interface SendPayload {
  body?: string | null;
  type?: MessageType;
  attachments?: unknown | null;
  replyToId?: string | null;
  metadata?: unknown | null;
}

/** Shape of the row returned by msg_send (matches generated types). */
interface ServerMessageRow {
  id: string;
  conversation_id: string;
  sender_actor_type: string;
  sender_actor_id: string;
  sender_user_id: string;
  type: string;
  body: string | null;
  attachments: unknown | null;
  reply_to_id: string | null;
  metadata: unknown | null;
  client_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export function useSendMessage(conversationId: string) {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  // Remember per-clientId payloads so retry can re-send with the same data.
  const payloadsRef = useRef<Map<string, SendPayload>>(new Map());

  const doSend = useCallback(
    async (clientId: string, payload: SendPayload) => {
      if (!actor || !conversationId) return;
      const { data, error } = await supabase.rpc('msg_send', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_body: payload.body ?? undefined,
        p_type: payload.type ?? 'text',
        p_attachments: (payload.attachments ?? undefined) as never,
        p_reply_to_id: payload.replyToId ?? undefined,
        p_metadata: (payload.metadata ?? undefined) as never,
        p_client_id: clientId,
      });
      if (error || !data) {
        markFailed(queryClient, conversationId, clientId);
        return;
      }
      const row = data as unknown as ServerMessageRow;
      resolveOptimistic(queryClient, conversationId, clientId, {
        id: row.id,
        conversation_id: row.conversation_id,
        sender_actor_type: row.sender_actor_type as ThreadMessage['sender_actor_type'],
        sender_actor_id: row.sender_actor_id,
        sender_user_id: row.sender_user_id,
        type: row.type as MessageType,
        body: row.body,
        attachments: row.attachments,
        reply_to_id: row.reply_to_id,
        metadata: row.metadata,
        client_id: row.client_id,
        edited_at: row.edited_at,
        deleted_at: row.deleted_at,
        created_at: row.created_at,
        status: 'sent',
      });
    },
    [actor, conversationId, queryClient],
  );

  const send = useCallback(
    async (payload: SendPayload) => {
      if (!actor || !conversationId) throw new Error('No active actor or conversation');
      const clientId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      payloadsRef.current.set(clientId, payload);

      const optimistic: ThreadMessage = {
        id: `optimistic-${clientId}`,
        conversation_id: conversationId,
        client_id: clientId,
        sender_actor_type: actor.actorType,
        sender_actor_id: actor.actorId,
        sender_user_id: actor.actorId,
        sender_name: null,
        sender_avatar_url: null,
        sender_username: null,
        sender_verified: null,
        type: payload.type ?? 'text',
        body: payload.body ?? null,
        attachments: payload.attachments ?? null,
        metadata: payload.metadata ?? null,
        reply_to_id: payload.replyToId ?? null,
        reply_preview: null,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        reactions: [],
        status: 'sending',
      };

      insertOptimistic(queryClient, conversationId, optimistic);
      await doSend(clientId, payload);
      return clientId;
    },
    [actor, conversationId, queryClient, doSend],
  );

  const retry = useCallback(
    async (clientId: string) => {
      const payload = payloadsRef.current.get(clientId);
      if (!payload || !conversationId) return;
      markSending(queryClient, conversationId, clientId);
      await doSend(clientId, payload);
    },
    [conversationId, queryClient, doSend],
  );

  return { send, retry };
}
