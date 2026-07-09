import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useMessagingActor } from './useMessagingActor';
import {
  insertOptimistic,
  resolveOptimistic,
  markFailed,
  markSending,
} from './threadCache';
import type {
  ThreadMessage,
  MessageType,
  MessageAttachment,
} from '@/types/messaging';
import { uploadMessageMedia } from './uploadMessageMedia';

export interface SendPayload {
  body?: string | null;
  type?: MessageType;
  attachments?: Json | null;
  replyToId?: string | null;
  metadata?: Json | null;
}

interface MediaPayload {
  kind: 'image' | 'voice';
  file: File | Blob;
  body?: string | null;
  localUrl: string;
}

type StoredPayload =
  | { kind: 'text'; payload: SendPayload }
  | { kind: 'media'; media: MediaPayload };

/** Shape of the row returned by msg_send (matches generated types). */
interface ServerMessageRow {
  id: string;
  conversation_id: string;
  sender_actor_type: string;
  sender_actor_id: string;
  sender_user_id: string;
  type: string;
  body: string | null;
  attachments: Json | null;
  reply_to_id: string | null;
  metadata: Json | null;
  client_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

function makeClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useSendMessage(conversationId: string) {
  const actor = useMessagingActor();
  const queryClient = useQueryClient();

  // Remember per-clientId payloads so retry can re-send with the same data.
  const payloadsRef = useRef<Map<string, StoredPayload>>(new Map());

  const applyServerRow = useCallback(
    (clientId: string, row: ServerMessageRow) => {
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
    [conversationId, queryClient],
  );

  const doSendText = useCallback(
    async (clientId: string, payload: SendPayload) => {
      if (!actor || !conversationId) return;
      const { data, error } = await supabase.rpc('msg_send', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_body: payload.body ?? undefined,
        p_type: payload.type ?? 'text',
        p_attachments: payload.attachments ?? undefined,
        p_reply_to_id: payload.replyToId ?? undefined,
        p_metadata: payload.metadata ?? undefined,
        p_client_id: clientId,
      });
      if (error || !data) {
        markFailed(queryClient, conversationId, clientId);
        return;
      }
      applyServerRow(clientId, data as unknown as ServerMessageRow);
    },
    [actor, conversationId, queryClient, applyServerRow],
  );

  const doSendMedia = useCallback(
    async (clientId: string, media: MediaPayload) => {
      if (!actor || !conversationId) return;
      try {
        const att = await uploadMessageMedia({
          conversationId,
          file: media.file,
          kind: media.kind,
        });
        const { data, error } = await supabase.rpc('msg_send', {
          p_conversation_id: conversationId,
          p_as_actor_type: actor.actorType,
          p_as_actor_id: actor.actorId,
          p_body: media.body ?? undefined,
          p_type: media.kind,
          p_attachments: [att] as unknown as Json,
          p_client_id: clientId,
        });
        if (error || !data) {
          markFailed(queryClient, conversationId, clientId);
          return;
        }
        applyServerRow(clientId, data as unknown as ServerMessageRow);
        // Revoke only after the server row has replaced the optimistic preview.
        try {
          URL.revokeObjectURL(media.localUrl);
        } catch {
          // ignore
        }
      } catch {
        markFailed(queryClient, conversationId, clientId);
        // On failure, keep the object URL so the failed bubble still renders.
      }
    },
    [actor, conversationId, queryClient, applyServerRow],
  );

  const send = useCallback(
    async (payload: SendPayload) => {
      if (!actor || !conversationId) throw new Error('No active actor or conversation');
      const clientId = makeClientId();
      payloadsRef.current.set(clientId, { kind: 'text', payload });

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
      await doSendText(clientId, payload);
      return clientId;
    },
    [actor, conversationId, queryClient, doSendText],
  );

  const sendMedia = useCallback(
    async (params: { file: File | Blob; kind: 'image' | 'voice'; body?: string | null }) => {
      if (!actor || !conversationId) throw new Error('No active actor or conversation');
      const clientId = makeClientId();
      const localUrl = URL.createObjectURL(params.file);
      const media: MediaPayload = {
        kind: params.kind,
        file: params.file,
        body: params.body ?? null,
        localUrl,
      };
      payloadsRef.current.set(clientId, { kind: 'media', media });

      const optimisticAttachment: MessageAttachment = {
        path: '',
        kind: params.kind,
        localUrl,
        uploadStatus: 'uploading',
        w: null,
        h: null,
      };

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
        type: params.kind,
        body: params.body ?? null,
        attachments: [optimisticAttachment] as unknown as Json,
        metadata: null,
        reply_to_id: null,
        reply_preview: null,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        reactions: [],
        status: 'sending',
      };

      insertOptimistic(queryClient, conversationId, optimistic);
      await doSendMedia(clientId, media);
      return clientId;
    },
    [actor, conversationId, queryClient, doSendMedia],
  );

  const retry = useCallback(
    async (clientId: string) => {
      const stored = payloadsRef.current.get(clientId);
      if (!stored || !conversationId) return;
      markSending(queryClient, conversationId, clientId);
      if (stored.kind === 'media') {
        await doSendMedia(clientId, stored.media);
      } else {
        await doSendText(clientId, stored.payload);
      }
    },
    [conversationId, queryClient, doSendText, doSendMedia],
  );

  return { send, sendMedia, retry };
}
